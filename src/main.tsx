import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Crash } from './components/Crash';
// 0.2.55 (board DS3): Nunito served from chefmealan.com, not Google: four weights, the browser fetches only the letters a page needs
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import './index.css';

import { notSavedPicture } from './notSaved';
// 0.3.133 (Coach Milan 11 November 20:29, Go): a photo named on this phone but not saved here shows a plain picture that
// says so, never a broken image
document.addEventListener('error', (e) => { const t = e.target as HTMLImageElement | null; if (t && t.tagName === 'IMG' && (t.getAttribute('src') ?? '').startsWith('pf:')) t.src = notSavedPicture(); }, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Crash>
      <App />
    </Crash>
  </StrictMode>,
);
