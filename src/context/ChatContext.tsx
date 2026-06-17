import { useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import { topics, ChatMessage, llms, FetchDatasetBody, RecolorBody, GradientColorResponse, GradientColorBasedOnZone, AppliedRecolor, Feature, ReqFilterProperty, ReqGradientColorBasedOnZone } from '../types';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';
import { useLayerContext } from './LayerContext';
import { useMapContext } from './MapContext';
import { ChatContext } from './chatContextDef';
import { t } from '../i18n';
import { recomputeLayerState } from '../utils/recolorUtils';
import { v4 as uuidv4 } from 'uuid';

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authResponse } = useAuth();
  const { geoPoints, setGeoPoints, setGradientColorBasedOnZone } = useCatalogContext();
  const { handleFetchDataset, setCentralizeOnce, incrementFormStage } = useLayerContext();
  const { mapRef } = useMapContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<topics>(topics.DEFAULT);
  const [colors] = useState<string[][]>([]);
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      const greetingMessage = {
        content: `Hi, ${authResponse?.displayName || 'there'} how can I help you?`,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, greetingMessage]);
        hasGreeted.current = true;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, authResponse?.displayName]);

  const clearChat = () => {
    setMessages([]);
    hasGreeted.current = false;
  };

  const closeChat = () => {
    setIsOpen(false);
    clearChat();
  };

  const fetchDataset = async (endpoint: string, body: FetchDatasetBody) => {
    try {
      setIsLoading(true);

      const response = await apiRequest({
        url: endpoint,
        method: 'post',
        body: body,
        isAuthRequest: true,
      });

      const responseData = response?.data?.data;

      const successMessage: ChatMessage = {
        content: `Dataset fetched successfully. ${responseData?.features?.length || 0} records retrieved.`,
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: {
          is_valid: true,
          reason: null,
          suggestions: null,
          endpoint: endpoint,
          body: responseData,
        },
      };

      setMessages(prev => [...prev, successMessage]);

      if (body.action === 'full data') {
        setCentralizeOnce(true);
      }

      await handleFetchDataset(body.action || 'sample', undefined, undefined, undefined, body);

      incrementFormStage();

      return responseData;
    } catch (error) {
      console.error('Error fetching dataset:', error);

      const errorMessage: ChatMessage = {
        content: 'Sorry, there was an error fetching the dataset.',
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: {
          is_valid: false,
          reason: error instanceof Error ? error.message : 'Unknown error',
          suggestions: null,
          endpoint: null,
          body: null,
        },
      };

      setMessages(prev => [...prev, errorMessage]);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      const userMessage: ChatMessage = {
        content,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      let url = '';
      let reqBody = {};

      if (topic === topics.RECOLOR) {
        url = urls.recolor_based_llm;
        reqBody = {
          user_id: authResponse?.localId,
          prompt: content.trim(),
          layers: geoPoints.map(gp => ({ id: gp.layer_id, name: gp.layer_name })),
        };
      } else if (topic === topics.DATASET) {
        url = urls.process_llm_query;
        const bounds = mapRef.current?.getBounds();
        reqBody = {
          query: content.trim(),
          user_id: authResponse?.localId,
          top_lng: bounds?.getEast(),
          top_lat: bounds?.getNorth(),
          bottom_lng: bounds?.getWest(),
          bottom_lat: bounds?.getSouth(),
        };
      } else {
        url = urls.recolor_based_llm;
        reqBody = {
          user_id: authResponse?.localId,
          prompt: content.trim(),
          layers: geoPoints.map(gp => ({ id: gp.layer_id, name: gp.layer_name })),
        };
      }

      const response = await apiRequest({
        url,
        method: 'post',
        body: reqBody,
        isAuthRequest: true,
      });

      const responseData = response?.data?.data;

      let responseMessage = '';
      if (responseData?.is_valid === 'Valid' || responseData?.is_valid === true) {
        if (topic === topics.DATASET) {
          responseMessage = t("i-found-a-dataset-matching-your-request-in-city-country", {
            query: responseData.body.boolean_query,
            city: responseData.body.city_name,
            country: responseData.body.country_name,
          });
        } else {
          responseMessage = t("i-can-apply-these-changes-for-you-would-you-like-to-proceed");
        }
      } else {
        responseMessage = responseData?.reason || t("sorry-i-could-not-process-your-request");
      }

      const botMessage: ChatMessage = {
        content: responseMessage,
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: responseData,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        content: t("sorry-an-error-occurred-while-processing-your-request"),
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyGradientColor = async (endpointOrResponseData: string | GradientColorResponse, body?: RecolorBody) => {
    try {
      setIsLoading(true);

      // Determine if first parameter is an endpoint string or response data object
      const isEndpointString = typeof endpointOrResponseData === 'string';

      let processedBody: RecolorBody | undefined;
      let endpoint: string;

      if (isEndpointString) {
        // Original behavior - direct API call with endpoint and body
        endpoint = endpointOrResponseData;
        processedBody = body;
      } else {
        // Handle LLM response data
        const responseData = endpointOrResponseData;

        // Extract and validate parameters from LLM response
        if (!responseData || !responseData.body) {
          throw new Error(t("invalid-llm-response-data"));
        }

        // Determine which endpoint to use based on the response
        if (responseData.endpoint) {
          endpoint = responseData.endpoint;
        } else {
          // Default to the LLM-based endpoint if not specified
          endpoint = llms.FETCH;
        }

        // Check if body is ReqFilterProperty-shaped (from the property-based agent).
        // The recolor_property endpoint expects it as-is without transformation.
        if ('evaluation_property_name' in responseData.body) {
          processedBody = {
            ...responseData.body,
            user_id: authResponse?.localId,
          } as unknown as RecolorBody;
        } else {
          // Process and validate the LLM response body (RecolorBody path)
          processedBody = processLLMResponseBody(responseData.body);
        }
      }

      // Make the API request with validated parameters
      const response = await apiRequest({
        url: urls[endpoint as keyof typeof urls],
        method: 'post',
        body: processedBody,
        isAuthRequest: true,
      });

      // Process the response data if needed
      if (response?.data?.data) {
        await handleRecolorResponse(response.data.data, processedBody);
      }

      const successMessage: ChatMessage = {
        content: 'Changes applied successfully!',
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Apply gradient color error:', error);
      const errorMessage: ChatMessage = {
        content: 'Sorry, an error occurred while applying the changes.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process LLM response body
  const processLLMResponseBody = (responseBody: RecolorBody): RecolorBody => {
    // Ensure required fields are present
    if (!responseBody) {
      throw new Error(t("missing-response-body"));
    }

    // Extract parameters, defaulting if necessary
    const {
      color_grid_choice = colors?.[0] || ['#ff0000', '#00ff00', '#0000ff'],
      change_layer_id,
      change_layer_name,
      based_on_layer_id,
      based_on_layer_name,
      coverage_property = 'radius',
      coverage_value = 1000,
      color_based_on,
      list_names = [],
      threshold,
      user_id = authResponse?.localId,
    } = responseBody;

    // Validate essential parameters
    if (!change_layer_id || !based_on_layer_id) {
      throw new Error(t("missing-required-layer-ids-in-response"));
    }

    // Format parameters appropriately
    return {
      color_grid_choice,
      change_layer_id,
      change_layer_name: change_layer_name || `Layer ${change_layer_id}`,
      based_on_layer_id,
      based_on_layer_name: based_on_layer_name || `Layer ${based_on_layer_id}`,
      coverage_property,
      coverage_value,
      change_layer_new_color: responseBody.change_layer_new_color || '',
      change_layer_orginal_color: responseBody.change_layer_orginal_color || '',
      color_based_on,
      list_names: Array.isArray(list_names)
        ? list_names.filter((name: string) => name.trim() !== '')
        : [],
      threshold,
      user_id,
    };
  };

  // Helper function to handle recolor response
  const handleRecolorResponse = async (
    responseData: GradientColorBasedOnZone[],
    requestBody?: RecolorBody,
  ) => {
    if (!responseData || !Array.isArray(responseData)) return;

    // Group response items by layer_id so we can match all sub-layers per geoPoint
    const layersMap = new Map<string, GradientColorBasedOnZone[]>();
    for (const item of responseData) {
      const id = item.layer_id;
      if (!layersMap.has(id)) layersMap.set(id, []);
      layersMap.get(id)!.push(item);
    }

    // Update geoPoints with recolor information using the applied_recolors pattern
    setGeoPoints(prev => {
      return prev.map(point => {
        const matchingGroups = layersMap.get(point.layer_id);
        if (!matchingGroups || matchingGroups.length === 0) return point;

        // Save original features if not already saved
        const original_features = (point.original_features ||
          point.features) as Feature[];

        // Build recolor groups from the response
        const groups = matchingGroups.map(group => ({
          color: group.points_color || '#000000',
          legend: group.layer_legend || '',
          features: group.features as Feature[],
        }));

        // Create a name describing what was done
        const legendParts = matchingGroups
          .map(g => g.layer_legend)
          .filter(Boolean);
        const recolorName = legendParts.join(' | ');

        // Build the AppliedRecolor entry
        const newRecolor: AppliedRecolor = {
          id: uuidv4(),
          name: recolorName || 'Recolor from chat',
          baseColor: point.points_color || '#CCCCCC',
          groups,
          save_request: requestBody as
            | ReqFilterProperty
            | ReqGradientColorBasedOnZone
            | undefined,
        };

        const applied_recolors = [
          ...(point.applied_recolors || []),
          newRecolor,
        ];

        // Recompute layer state from original features + filters + updated recolors
        const recomputed = recomputeLayerState(
          original_features,
          point.applied_filters,
          applied_recolors,
          point.layer_legend,
        );

        return {
          ...point,
          original_features,
          applied_recolors,
          ...recomputed,
        };
      });
    });

    // Store gradient color data for reference
    setGradientColorBasedOnZone(responseData);
  };

  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isOpen,
        sendMessage,
        toggleChat,
        closeChat,
        clearChat,
        applyGradientColor,
        fetchDataset,
        topic,
        setTopic,
        setMessages,
        takeAction: () => {},
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
