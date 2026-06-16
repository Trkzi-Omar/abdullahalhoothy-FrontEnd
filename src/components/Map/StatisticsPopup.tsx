import React, { useCallback, useEffect, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import * as turf from '@turf/turf';
import { useUIContext } from '../../context/UIContext';
import { PolygonFeature, Section } from '../../types/allTypesAndInterfaces';
import { formatLargeNumber } from '../../utils/formatters';
import { t } from '../../i18n';
import { useMapContext } from '../../context/MapContext';


function calculatePercentageDifference(number: number | string, benchmark: number | string) {
  const numVal = typeof number === 'number' ? number : parseFloat(String(number));
  const benchVal = typeof benchmark === 'number' ? benchmark : parseFloat(String(benchmark));

  if (isNaN(numVal) || isNaN(benchVal) || numVal === 0 || benchVal === 0) return '0';

  const difference = Math.abs(numVal - benchVal);
  const average = (numVal + benchVal) / 2;
  const percentageDifference = (difference / average) * 100;
  return percentageDifference.toFixed(0);
}

function CloseButton({ polygon }: { polygon: PolygonFeature }) {
  const { polygons, setPolygons } = useCatalogContext();
  const closePopup = () => {
    const updatedPolygons = polygons.map(p => {
      if (p.id === polygon.id) {
        return { ...p, isStatisticsPopupOpen: false };
      }
      return p;
    });
    setPolygons(updatedPolygons);
  };
  return (
    <button
      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
      onClick={closePopup}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.0002 4.99994L5.00024 18.9999M5.00024 4.99994L19.0002 18.9999"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function StatisticsPopup({ polygon }: { polygon: PolygonFeature }) {
  const { isMobile } = useUIContext();
  const { polygons, setPolygons } = useCatalogContext();
  const { drawRef } = useMapContext();

  const handleDelete = useCallback(() => {
    if (drawRef.current) {
      try {
        drawRef.current.delete(polygon.id);
      } catch (err) {
        console.error('Error deleting polygon from Mapbox Draw:', err);
      }
    }
    setPolygons(polygons.filter(p => p.id !== polygon.id));
  }, [polygon.id, polygons, setPolygons, drawRef]);

  return (
    <>
      {isMobile && <MobileStatisticsPopup polygon={polygon} onDelete={handleDelete} />}
      {!isMobile && <DesktopStatisticsPopup polygon={polygon} onDelete={handleDelete} />}
    </>
  );
}

function DesktopStatisticsPopup({ polygon, onDelete }: { polygon: PolygonFeature; onDelete: () => void }) {
  const { sections, benchmarks, isBenchmarkControlOpen, setIsBenchmarkControlOpen, setPolygons } =
    useCatalogContext();
  const { drawRef } = useMapContext();

  const [popupPosition, setPopupPosition] = useState({
    x: polygon.pixelPosition ? polygon.pixelPosition.x : 0,
    y: polygon.pixelPosition ? polygon.pixelPosition.y : 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(polygon.name || '');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getAggregatedData = (points: Section['points'], areas: string[]) => {
    return areas.map(area => {
      let totalCount = 0;
      let totalSum = 0;
      let sumPercentages = 0;
      let pointsCountForArea = 0;

      points.forEach(point => {
        const areaData = point.data.find(d => d.area === area);
        if (areaData) {
          totalCount += areaData.count;
          totalSum += areaData.sum;
          if (typeof areaData.percentage === 'number') {
            sumPercentages += areaData.percentage;
            pointsCountForArea++;
          }
        }
      });

      const avg = totalCount ? (totalSum / totalCount).toFixed(2) : '-';
      const percentage = pointsCountForArea ? parseFloat((sumPercentages / pointsCountForArea).toFixed(1)) : 0;

      return {
        count: totalCount,
        sum: totalSum,
        avg,
        percentage,
        area,
      };
    });
  };

  const formatAvgValue = (avg: number | string) => {
    if (avg === '-') return '-';
    const val = typeof avg === 'number' ? avg : parseFloat(avg);
    if (isNaN(val)) return '-';
    const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
    return formatLargeNumber(rounded);
  };

  const formatSumValue = (sum: number | string) => {
    const val = typeof sum === 'number' ? sum : parseFloat(sum);
    if (isNaN(val)) return '-';
    const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
    return formatLargeNumber(rounded);
  };

  useEffect(() => {
    setEditNameValue(polygon.name || '');
  }, [polygon.name]);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (!editNameValue.trim()) return;

    setPolygons(prev =>
      prev.map(p => {
        if (p.id === polygon.id) {
          return { ...p, name: editNameValue.trim() };
        }
        return p;
      })
    );

    if (drawRef.current) {
      try {
        drawRef.current.setFeatureProperty(polygon.id, 'user_name', editNameValue.trim());
      } catch (err) {
        console.error('Error updating name in draw control:', err);
      }
    }
  };

  const handleToggleLock = () => {
    const nextLockedState = !polygon.isLocked;
    setPolygons(prev =>
      prev.map(p => {
        if (p.id === polygon.id) {
          return { ...p, isLocked: nextLockedState };
        }
        return p;
      })
    );
  };

  // Make the popup draggable by clicking on the header title bar
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.movementX;
      const deltaY = e.movementY;
      setPopupPosition(prevPosition => ({
        x: prevPosition.x + deltaX,
        y: prevPosition.y + deltaY,
      }));
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (polygon.pixelPosition) {
      setPopupPosition({
        x: polygon.pixelPosition.x,
        y: polygon.pixelPosition.y,
      });
    }
  }, [polygon]);

  if (!polygon || !polygon.isStatisticsPopupOpen || !sections) return null;

  const polygonSections = sections.find(
    section => section.polygon && section.polygon.id === polygon.id
  );

  if (!polygonSections) return null;

  const visibleSections = polygonSections.sections;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl lg:max-h-[32rem] overflow-hidden absolute p-5 z-10 flex flex-col max-w-[calc(100vw-4rem)] max-h-[90vh] transition-all duration-200 ${isCollapsed
          ? 'min-w-[16rem]'
          : polygonSections.polygon.properties.shape === 'circle'
            ? 'min-w-[75rem]'
            : 'min-w-[32rem]'
        }`}
      style={{
        position: 'absolute',
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        zIndex: 1000, // Ensure the popup is above the map
        borderInlineStart: `4px solid ${polygon.color || '#3B82F6'}`,
      }}
    >
      <div className="bg-white mx-auto font-sans w-full h-full flex flex-col">
        <div
          className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{t("statistics")} - </span>
            {isEditingName ? (
              <input
                type="text"
                value={editNameValue}
                onChange={e => setEditNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
                autoFocus
                onMouseDown={e => e.stopPropagation()}
              />
            ) : (
              <span
                onClick={() => {
                  setEditNameValue(polygon.name || '');
                  setIsEditingName(true);
                }}
                className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors text-slate-700 font-bold flex items-center gap-1"
                title={t("click-to-rename") || "Click to rename"}
              >
                {polygon.name || `Polygon ${polygon.id.substring(0, 5)}`}
                <svg className="w-3.5 h-3.5 text-slate-400 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
            )}
          </h3>
          <div className="flex gap-2" onMouseDown={e => e.stopPropagation()}>
            <button
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                polygon.isLocked
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              onClick={handleToggleLock}
              title={polygon.isLocked ? t("unlock") || "Unlock" : t("lock") || "Lock"}
              aria-label={polygon.isLocked ? t("unlock") || "Unlock" : t("lock") || "Lock"}
            >
              {polygon.isLocked ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
              onClick={onDelete}
              title={t("delete") || "Delete"}
              aria-label={t("delete") || "Delete"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M10 11V17M14 11V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-100 text-lg font-semibold leading-none hover:text-slate-900 text-slate-500 transition-colors"
              onClick={() => setIsCollapsed(prev => !prev)}
              aria-label={isCollapsed ? t("open") : t("close")}
            >
              {isCollapsed ? '+' : '-'}
            </button>
            <CloseButton polygon={polygon} />
          </div>
        </div>
        {!isCollapsed && (
          <div className="statistics-popup-scroll overflow-auto w-full flex-1 pr-1">
            <table
              className="w-full text-xs border-collapse"
              style={{ minWidth: polygonSections.areas.length > 1 ? '85rem' : '56rem' }}
            >
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="text-start pb-4 w-1/4 bg-white" colSpan={2}>
                    <div className="flex items-center gap-3">
                      <img
                        src="/slocator.png"
                        alt={t("logo")}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100"
                      />
                      <div className="flex flex-col text-start">
                        <span className="font-bold text-slate-800 text-sm">S-Locator</span>
                        <span className="text-[10px] text-slate-400 font-normal">Geographic Insights</span>
                      </div>
                    </div>
                  </th>
                  <th className="w-3/4 pb-4 p-0 bg-white" colSpan={9}>
                    <div className="flex gap-4 w-full justify-end">
                      {polygonSections.areas.map(area => {
                        return (
                          <div
                            key={area}
                            className="flex-1 min-w-0 font-normal space-y-1"
                          >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center font-semibold rounded-t-lg h-9 w-full flex items-center justify-center shadow-sm text-[11px] px-2">
                              {area === "Unknown"
                                ? `Area ${(turf.area(polygon) / 1000000).toFixed(3)} km²`
                                : area}
                            </div>
                            <div className="flex bg-slate-50 border-x border-b border-slate-200/60 rounded-b-lg text-slate-600 font-semibold text-[10px] tracking-wider uppercase">
                              <span className="py-2 w-[15%] text-center border-e border-slate-200/60 truncate">{t("count")}</span>
                              <span className="py-2 w-[15%] text-center border-e border-slate-200/60 truncate">{t("avg")}</span>
                              <span className="py-2 w-[22%] text-center border-e border-slate-200/60 truncate">{t("percentage")}</span>
                              <span className="py-2 w-[18%] text-center border-e border-slate-200/60 truncate">{t("sum")}</span>
                              <span className="py-2 w-[30%] text-center whitespace-nowrap truncate">{t("vs-benchmark")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSections.map(section => {
                  const benchmark = benchmarks.find(benchmark => benchmark.title === section.title);
                  const isExpanded = !!expandedSections[section.title];
                  const aggregatedData = getAggregatedData(section.points, polygonSections.areas);

                  return (
                    <React.Fragment key={section.title}>
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={isExpanded ? 11 : 2}
                          className="font-bold text-indigo-700 py-2.5 px-3 text-xs tracking-wider uppercase border-t border-slate-200/60 align-middle"
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(section.title);
                              }}
                              className="p-1 hover:bg-slate-200/80 rounded transition-colors text-slate-500 hover:text-slate-800 flex items-center justify-center"
                              title={isExpanded ? t("collapse") || "Collapse" : t("expand") || "Expand"}
                            >
                              <svg
                                className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <span>{section.title.split('_').join(' ')}</span>
                          </div>
                        </td>
                        {!isExpanded && (
                          <td className="w-3/4 p-0 py-1.5 bg-slate-50/50 border-t border-slate-200/60" colSpan={9}>
                            <div className="flex gap-4 w-full justify-end">
                              {aggregatedData.map(data => {
                                const isHigher = benchmark?.value && data.avg && data.avg !== '-'
                                  ? parseFloat(String(data.avg)) >= parseFloat(String(benchmark.value))
                                  : false;

                                return (
                                  <div
                                    key={`aggregated-${section.title}-${data.area}`}
                                    className="flex-1 min-w-0 flex items-center h-9 bg-slate-50/30 border border-slate-100 rounded-lg text-[11px] text-slate-600 font-medium"
                                  >
                                    <div className="text-center py-1.5 w-[15%] border-e border-slate-100/80">{data.count}</div>
                                    <div className="text-center py-1.5 w-[15%] border-e border-slate-100/80 font-mono">
                                      {formatAvgValue(data.avg)}
                                    </div>
                                    <div className="text-center py-1.5 w-[22%] border-e border-slate-100/80">{data.percentage}%</div>
                                    <div className="text-center py-1.5 w-[18%] border-e border-slate-100/80 font-mono">
                                      {formatSumValue(data.sum)}
                                    </div>
                                    <div className="text-center w-[30%] h-full flex items-center justify-center">
                                      {benchmark?.value === '' && (
                                        <button
                                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors text-[10px]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsBenchmarkControlOpen(!isBenchmarkControlOpen);
                                          }}
                                        >
                                          {t("set-benchmark")}
                                        </button>
                                      )}
                                      {benchmark?.value !== '' && (
                                        <div
                                          className={`w-full h-full flex items-center justify-center font-semibold rounded-e-lg text-[10px] ${isHigher
                                              ? 'bg-emerald-50 text-emerald-600'
                                              : 'bg-red-50 text-red-600'
                                            }`}
                                        >
                                          {calculatePercentageDifference(data.avg, benchmark?.value)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && section.points.map(point => (
                        <tr
                          key={`${section.title}-${point.layer_name}`}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-3 px-3 w-1/4 font-semibold text-slate-500" style={{ paddingInlineStart: '2.5rem' }} colSpan={2}>
                            {point.layer_name}
                          </td>
                          <td className="w-3/4 p-0 py-1.5" colSpan={9}>
                            <div className="flex gap-4 w-full justify-end">
                              {point.data.map(data => {
                                const isHigher = benchmark?.value && data.avg && data.avg !== '-'
                                  ? parseFloat(String(data.avg)) >= parseFloat(String(benchmark.value))
                                  : false;

                                return (
                                  <div
                                    key={`${point.layer_name}-${data.area}km`}
                                    className="flex-1 min-w-0 flex items-center h-9 bg-slate-50/30 border border-slate-100 rounded-lg group-hover:bg-white group-hover:border-slate-200/80 transition-all text-[11px] text-slate-600 font-medium"
                                  >
                                    <div className="text-center py-1.5 w-[15%] border-e border-slate-100/80">{data.count}</div>
                                    <div className="text-center py-1.5 w-[15%] border-e border-slate-100/80 font-mono">
                                      {formatAvgValue(data.avg)}
                                    </div>
                                    <div className="text-center py-1.5 w-[22%] border-e border-slate-100/80">{data.percentage}%</div>
                                    <div className="text-center py-1.5 w-[18%] border-e border-slate-100/80 font-mono">
                                      {formatSumValue(data.sum)}
                                    </div>
                                    <div className="text-center w-[30%] h-full flex items-center justify-center">
                                      {benchmark?.value === '' && (
                                        <button
                                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors text-[10px]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsBenchmarkControlOpen(!isBenchmarkControlOpen);
                                          }}
                                        >
                                          {t("set-benchmark")}
                                        </button>
                                      )}
                                      {benchmark?.value !== '' && (
                                        <div
                                          className={`w-full h-full flex items-center justify-center font-semibold rounded-e-lg text-[10px] ${isHigher
                                              ? 'bg-emerald-50 text-emerald-600'
                                              : 'bg-red-50 text-red-600'
                                            }`}
                                        >
                                          {calculatePercentageDifference(data.avg, benchmark?.value)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const MobileStatisticsPopup = ({ polygon, onDelete }: { polygon: PolygonFeature; onDelete: () => void }) => {
  const { sections, benchmarks, isBenchmarkControlOpen, setIsBenchmarkControlOpen, setPolygons } =
    useCatalogContext();
  const { drawRef } = useMapContext();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(polygon.name || '');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const formatAvgValue = (avg: number | string) => {
    if (avg === '-') return '-';
    const val = typeof avg === 'number' ? avg : parseFloat(avg);
    if (isNaN(val)) return '-';
    const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
    return formatLargeNumber(rounded);
  };

  const formatSumValue = (sum: number | string) => {
    const val = typeof sum === 'number' ? sum : parseFloat(sum);
    if (isNaN(val)) return '-';
    const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
    return formatLargeNumber(rounded);
  };

  useEffect(() => {
    setEditNameValue(polygon.name || '');
  }, [polygon.name]);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (!editNameValue.trim()) return;

    setPolygons(prev =>
      prev.map(p => {
        if (p.id === polygon.id) {
          return { ...p, name: editNameValue.trim() };
        }
        return p;
      })
    );

    if (drawRef.current) {
      try {
        drawRef.current.setFeatureProperty(polygon.id, 'user_name', editNameValue.trim());
      } catch (err) {
        console.error('Error updating name in draw control:', err);
      }
    }
  };

  const handleToggleLock = () => {
    const nextLockedState = !polygon.isLocked;
    setPolygons(prev =>
      prev.map(p => {
        if (p.id === polygon.id) {
          return { ...p, isLocked: nextLockedState };
        }
        return p;
      })
    );
  };

  if (!polygon || !polygon.isStatisticsPopupOpen || !sections) return null;

  const polygonSections = sections.find(
    section => section.polygon && section.polygon.id === polygon.id
  );

  if (!polygonSections || !polygonSections.sections || polygonSections.sections.length === 0)
    return null;

  if (isBenchmarkControlOpen) return null;

  const visibleSections = polygonSections.sections;

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 mx-4 my-2 start-0 end-0 bg-white shadow-lg rounded-lg p-4 z-50 overflow-y-auto text-sm"
      style={{
        height: '80vh',
        borderInlineStart: `4px solid ${polygon.color || '#3B82F6'}`,
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-blue-600 flex items-center gap-1.5 flex-wrap">
          <span>{t("statistics")} - </span>
          {isEditingName ? (
            <input
              type="text"
              value={editNameValue}
              onChange={e => setEditNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <span
              onClick={() => {
                setEditNameValue(polygon.name || '');
                setIsEditingName(true);
              }}
              className="cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors text-slate-700 font-bold flex items-center gap-1"
              title={t("click-to-rename") || "Click to rename"}
            >
              {polygon.name || `Polygon ${polygon.id.substring(0, 5)}`}
              <svg className="w-3.5 h-3.5 text-slate-400 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
              polygon.isLocked
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
            onClick={handleToggleLock}
            title={polygon.isLocked ? t("unlock") || "Unlock" : t("lock") || "Lock"}
            aria-label={polygon.isLocked ? t("unlock") || "Unlock" : t("lock") || "Lock"}
          >
            {polygon.isLocked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
            onClick={onDelete}
            title={t("delete") || "Delete"}
            aria-label={t("delete") || "Delete"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M10 11V17M14 11V17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <CloseButton polygon={polygon} />
        </div>
      </div>
      <div className="space-y-6">
        {polygonSections.areas.map((area, areaIndex) => (
          <div key={areaIndex} className="w-full border-t pt-4 space-y-4">
            {/* Header for the Area */}
            <div className="bg-blue-600 text-white text-center mb-4 h-9 w-full flex items-center justify-center">
              {area === "Unknown" ? `Area ${(turf.area(polygon) / 1000000).toFixed(3)} km²` : area}
            </div>
            {/* Data for the Area */}
            {visibleSections.map((section, sectionIndex) => {
              const benchmark = benchmarks.find(benchmark => benchmark.title === section.title);
              const isExpanded = !!expandedSections[section.title];

              // Calculate aggregated values for this area
              let totalCount = 0;
              let totalSum = 0;
              let sumPercentages = 0;
              let pointsCountForArea = 0;

              section.points.forEach(point => {
                const areaData = point.data.find(d => d.area === area);
                if (areaData) {
                  totalCount += areaData.count;
                  totalSum += areaData.sum;
                  if (typeof areaData.percentage === 'number') {
                    sumPercentages += areaData.percentage;
                    pointsCountForArea++;
                  }
                }
              });

              const avg = totalCount ? (totalSum / totalCount).toFixed(2) : '-';
              const percentage = pointsCountForArea ? parseFloat((sumPercentages / pointsCountForArea).toFixed(1)) : 0;

              if (!isExpanded) {
                return (
                  <div key={sectionIndex} className="flex flex-col gap-2 bg-gray-100 rounded-md p-4 border-l-4 border-indigo-500">
                    <div className="font-bold text-blue-600 text-base capitalize flex items-center justify-between">
                      <span>{section.title.split('_').join(' ')}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(section.title);
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 flex items-center justify-center"
                        title={t("expand") || "Expand"}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t("count-2")}</span>
                      <span className="text-gray-700">{totalCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t("average")}</span>
                      <span className="text-gray-700">{formatAvgValue(avg)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t("percentage")}</span>
                      <span className="text-gray-700">{percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t("sum-2")}</span>
                      <span className="text-gray-700">{formatSumValue(totalSum)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t("vs-benchmark-2")}</span>
                      <span>
                        {benchmark?.value === '' ? (
                          <button
                            className="text-blue-500 underline"
                            onClick={() => setIsBenchmarkControlOpen(!isBenchmarkControlOpen)}
                          >{t("set-benchmark")}</button>
                        ) : (
                          <div
                            className={`text-center p-1 rounded ${parseFloat(String(benchmark?.value)) > parseFloat(String(avg))
                                ? 'text-red-600'
                                : 'text-blue-600'
                              }`}
                          >
                            {calculatePercentageDifference(avg, benchmark?.value)}%
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={sectionIndex} className="space-y-4 border-l-4 border-indigo-500 pl-2">
                  <div className="font-bold text-blue-600 text-base capitalize flex items-center justify-between py-1 bg-slate-50/50 rounded px-2">
                    <span>{section.title.split('_').join(' ')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.title);
                      }}
                      className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 flex items-center justify-center"
                      title={t("collapse") || "Collapse"}
                    >
                      <svg
                        className="w-4 h-4 transform rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {section.points.map((point, pointIndex) => {
                    const dataForArea = point.data.find(data => data.area === area);

                    if (!dataForArea) return null;

                    return (
                      <div
                        key={pointIndex}
                        className="flex flex-col gap-2 bg-gray-100 rounded-md p-4 ml-4"
                      >
                        {/* Layer Name */}
                        <div className="font-medium text-gray-800 mb-2">{point.layer_name}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{t("count-2")}</span>
                          <span className="text-gray-700">{dataForArea.count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{t("average")}</span>
                          <span className="text-gray-700">{formatAvgValue(dataForArea.avg)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{t("percentage")}</span>
                          <span className="text-gray-700">{dataForArea.percentage}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{t("sum-2")}</span>
                          <span className="text-gray-700">{formatSumValue(dataForArea.sum)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{t("vs-benchmark-2")}</span>
                          <span>
                            {benchmark?.value === '' ? (
                              <button
                                className="text-blue-500 underline"
                                onClick={() => setIsBenchmarkControlOpen(!isBenchmarkControlOpen)}
                              >{t("set-benchmark")}</button>
                            ) : (
                              <div
                                className={`text-center p-1 rounded ${parseFloat(String(benchmark?.value)) > parseFloat(String(dataForArea.avg))
                                    ? 'text-red-600'
                                    : 'text-blue-600'
                                  }`}
                              >
                                {calculatePercentageDifference(dataForArea.avg, benchmark?.value)}%
                              </div>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
