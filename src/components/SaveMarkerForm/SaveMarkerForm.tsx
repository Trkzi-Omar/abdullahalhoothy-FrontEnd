import React from 'react';
import { t } from '../../i18n';

interface SaveMarkerFormProps {
  onSubmit: (name: string, description: string, color: string) => void;
  onCancel: () => void;
  initialName?: string;
  initialDescription?: string;
  initialColor?: string;
}

const defaultMarkerColor = '#7D00B8';

export const SaveMarkerForm: React.FC<SaveMarkerFormProps> = ({
  onSubmit,
  onCancel,
  initialName = '',
  initialDescription = '',
  initialColor = defaultMarkerColor,
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;

    if (name) {
      onSubmit(name, description, color || initialColor);
    }
  };

  return (
    <div className="p-0 w-44">
      <h2 className="text-xl font-bold mb-2">{t('marker')}</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="name" className="block mb-2 font-medium">
            {t('name-2')} <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            aria-required="true"
            placeholder={t('enter-a-name')}
            defaultValue={initialName}
          />
        </div>

        <div className="mb-2">
          <label htmlFor="color" className="block mb-2 font-medium">
            {t('color')}
          </label>
          <input
            id="color"
            name="color"
            type="color"
            className="w-full h-9 p-0 border rounded-md cursor-pointer"
            defaultValue={initialColor}
          />
        </div>

        <div className="mb-2">
          <label htmlFor="description" className="block mb-2 font-medium">
            {t('description')}
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder={t('enter-a-description')}
            className="w-full p-2 border rounded-md resize-none"
            defaultValue={initialDescription}
          />
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2 shadow-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="w-full px-4 py-2 shadow-sm bg-gem-gradient text-white rounded-md"
          >
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
};
