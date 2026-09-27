import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '../utils/copyText.js';

export function useClipboard() {
  const [toast, setToast] = useState(false);
  const [manualText, setManualText] = useState('');
  const timer = useRef(null);
  const request = useRef(0);
  useEffect(() => () => { clearTimeout(timer.current); request.current++; }, []);
  const copy = useCallback(async text => {
    const current = ++request.current;
    clearTimeout(timer.current);
    setToast(false);
    setManualText('');
    const result = await copyText(text);
    if (current !== request.current) return;
    if (result.copied) {
      setToast(true);
      timer.current = setTimeout(() => setToast(false), 2000);
    } else setManualText(result.text);
  }, []);
  return { toast, manualText, copy, closeManual: () => setManualText('') };
}
