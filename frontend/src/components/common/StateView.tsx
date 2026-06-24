import { type FC } from 'react';

interface StateViewProps {
  variant: 'loading' | 'empty' | 'error';
  rootClass: string;
  title: string;
  message?: string;
}

const StateView: FC<StateViewProps> = ({ variant, rootClass, title, message }) => (
  <div className={rootClass}>
    <h2 className={`${rootClass}__title`}>{title}</h2>
    <div className={`${rootClass}__${variant}`}>
      {variant === 'empty' ? <p>{message}</p> : message}
    </div>
  </div>
);

export default StateView;
