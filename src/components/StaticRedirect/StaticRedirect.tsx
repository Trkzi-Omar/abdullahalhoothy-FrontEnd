import { useParams } from 'react-router-dom';

const StaticRedirect = () => {
  const params = useParams();

  const filePath = params['*'];
  const staticFileUrl = `/static/${filePath}`;

  return (
    <div className="w-full h-full">
      <iframe
        src={staticFileUrl}
        className="w-full h-full border-none"
        title="Static Content"
      />
    </div>
  );
};

export default StaticRedirect;
