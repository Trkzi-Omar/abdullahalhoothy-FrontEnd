import React from 'react';
import placeHolderImage from '../../placeholderImage/layer.png';
import { UserLayerCardProps } from '../../types/allTypesAndInterfaces';
import { Progress } from '../common';
import { FaCheckCircle } from 'react-icons/fa';
import { t } from '../../i18n';


function UserLayerCard(props: UserLayerCardProps) {
  function handleMoreInfo() {
    props.onMoreInfo({
      id: props.id,
      name: props.name,
      typeOfCard: props.typeOfCard,
    });
  }

  return (
    <div className="relative transition-all">
      {/* Progress + Percentage */}
      {props.progress && props.progress > 0 && (
        <div className="absolute top-0 start-0 z-[1] w-full p-2 flex items-center gap-2 bg-white/70">
          <Progress value={props.progress} className="w-full" />
          {props.progress < 100 ? (
            <p className="text-sm text-gray-600 min-w-[40px] text-end">{props.progress}%</p>
          ) : (
            <FaCheckCircle className="text-green-500" />
          )}
        </div>
      )}

      <div className="border border-[#f0f0f0] rounded overflow-hidden bg-white flex flex-col h-full mt-5">
        <div className="overflow-hidden">
          <img
            alt={t("placeholder")}
            src={placeHolderImage}
            className="w-full h-[200px] object-contain scale-[0.8]"
          />
        </div>

        <div className="p-4 flex flex-col justify-between flex-grow">
          <div className="mb-4">
            <div className="flex flex-col">
              <div className="text-base font-bold">{props.name}</div>
            </div>
          </div>

          <div className="mt-2 flex-grow">
            <span className="block text-sm text-[#888]">{t("legend-2")}{' '}{props.legend}</span>
            <p className="m-0 text-sm text-[#555]">{t("description-2")}{' '}{props.description}</p>
          </div>
        </div>

        <ul className="list-none py-[10px] px-[5px] m-0 flex justify-around bg-[#f0f2f5] border-t border-[#dbdbdb] gap-x-[10px] w-full">
          <li className="flex items-center justify-center gap-x-[5px] font-medium text-[#1677ff]">
            <div
              onClick={handleMoreInfo}
              className="cursor-pointer inline-flex items-center hover:text-[#40a9ff] text-red-500 font-medium"
            >{t("add")}</div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserLayerCard;
