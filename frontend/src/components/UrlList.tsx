import { type FC } from 'react';

import { strings } from '../strings/jobDetails';
import type { UrlCheck } from '../types';
import UrlItem from './UrlItem';

interface UrlListProps {
  urls: UrlCheck[];
  cancellingUrls: string[];
  urlErrors: Record<string, string>;
  onCancelUrl: (url: string) => void;
}

const UrlList: FC<UrlListProps> = ({ urls, cancellingUrls, urlErrors, onCancelUrl }) => {
  const hasMultipleUrls = urls.length > 1;
  const totalLabel = `${urls.length} ${strings.totalLabel}`;

  const handleCancel = (url: string) => () => onCancelUrl(url);

  return (
    <div className="urls-section">
      <div className="urls-section__title">
        <span>{strings.urlsLabel}</span>
        <span className="urls-section__title-count">{totalLabel}</span>
      </div>

      <ul className="urls-section__list">
        {urls.map((urlCheck, index) => (
          <UrlItem
            key={urlCheck.url}
            urlCheck={urlCheck}
            index={index}
            showCancel={hasMultipleUrls}
            cancelling={cancellingUrls.includes(urlCheck.url)}
            cancelError={urlErrors[urlCheck.url]}
            onCancel={handleCancel(urlCheck.url)}
          />
        ))}
      </ul>
    </div>
  );
};

export default UrlList;
