import React, { useMemo, useState } from 'react';
import { NapCatWebApiResponse } from '../../types';

export interface NapCatConsoleProps {
  endpoint: string;
  initialAction?: string;
  request?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const panelStyle: React.CSSProperties = {
  border: '1px solid #d9e2ec',
  borderRadius: 12,
  padding: 16,
  display: 'grid',
  gap: 12,
  background: 'linear-gradient(145deg, #fffef9, #f3f8ff)',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

export const NapCatConsole: React.FC<NapCatConsoleProps> = ({
  endpoint,
  initialAction = 'send_group_msg',
  request = fetch,
}) => {
  const [action, setAction] = useState(initialAction);
  const [payloadText, setPayloadText] = useState('{\n  "group_id": 123456,\n  "message": "Hello from sa2kit"\n}');
  const [result, setResult] = useState<NapCatWebApiResponse<unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const prettyResult = useMemo(() => {
    if (!result) return '';
    return JSON.stringify(result, null, 2);
  }, [result]);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = JSON.parse(payloadText);
      const response = await request(`${endpoint}/action/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as NapCatWebApiResponse<unknown>;
      setResult(body);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, fontSize: 20, fontFamily: 'Avenir Next, Helvetica, sans-serif' }}>NapCat QQ Bot Console</h3>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>OneBot Action</span>
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="send_group_msg"
          style={{ border: '1px solid #bcccdc', borderRadius: 8, padding: '10px 12px' }}
        />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>JSON Payload</span>
        <textarea
          rows={8}
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
          style={{ border: '1px solid #bcccdc', borderRadius: 8, padding: '10px 12px', fontFamily: 'Menlo, monospace' }}
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          border: 0,
          borderRadius: 8,
          padding: '10px 14px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          color: '#fff',
          background: submitting ? '#829ab1' : '#0b7285',
          width: 180,
          fontWeight: 700,
        }}
      >
        {submitting ? 'Requesting...' : 'Run Action'}
      </button>
      {prettyResult ? (
        <pre
          style={{
            margin: 0,
            padding: 12,
            borderRadius: 8,
            background: '#102a43',
            color: '#f0f4f8',
            overflowX: 'auto',
            fontSize: 12,
          }}
        >
          {prettyResult}
        </pre>
      ) : null}
    </section>
  );
};
