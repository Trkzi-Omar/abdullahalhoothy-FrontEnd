import { useLocation, useNavigate } from 'react-router-dom';

export function usePreserveQueryNavigate() {
  const nav = useNavigate();
  const { search = '' } = useLocation();
  function navigate(to: string, query: string = '') {
    return nav({
      pathname: to,
      search: query ? `${search}&${query}` : search,
    });
  }
  return navigate;
}
