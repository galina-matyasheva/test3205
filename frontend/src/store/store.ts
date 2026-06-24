import { configureStore } from '@reduxjs/toolkit';

import activeJobReducer from './activeJobSlice';
import jobsReducer from './jobsSlice';

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    activeJob: activeJobReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
