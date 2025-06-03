import React from 'react';

interface MeasurementFormProps {
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
  initialName?: string;
  initialDescription?: string;
}

export const MeasurementForm: React.FC<MeasurementFormProps> = ({
  onSubmit,
  onCancel,
  initialName = '',
  initialDescription = '',
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (name) {
      onSubmit(name, description);
    }
  };

  return (
    <div className="p-0 w-44">
      <h2 className="text-xl font-bold mb-2">Measurement</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="name" className="block mb-2 font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            aria-required="true"
            placeholder="Enter a name"
            defaultValue={initialName}
          />
        </div>

        <div className="mb-2">
          <label htmlFor="description" className="block mb-2 font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Enter a description"
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
            Cancel
          </button>
          <button
            type="submit"
            className="w-full px-4 py-2 shadow-sm bg-gem-gradient text-white rounded-md"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
