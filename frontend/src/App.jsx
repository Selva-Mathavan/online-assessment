import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const LS_TOKEN = 'assessment_token_v1';
const LS_ATTEMPT = 'assessment_attempt_v1';
const LS_LOCAL_ANSWERS = 'assessment_local_answers_v1';

function saveToken(t) { localStorage.setItem(LS_TOKEN, t); }
function readToken() { return localStorage.getItem(LS_TOKEN); }
function saveAttemptInfo(obj) { localStorage.setItem(LS_ATTEMPT, JSON.stringify(obj)); }
function readAttemptInfo() { try { return JSON.parse(localStorage.getItem(LS_ATTEMPT)); } catch { return null; } }
function saveLocalAnswers(obj) { localStorage.setItem(LS_LOCAL_ANSWERS, JSON.stringify(obj)); }
function readLocalAnswers() { try { return JSON.parse(localStorage.getItem(LS_LOCAL_ANSWERS)); } catch { return {}; } }

export default function App() {
  const [stage, setStage] = useState('intro');
  const [token, setToken] = useState(readToken());
  const [attemptInfo, setAttemptInfo] = useState(readAttemptInfo());
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(() => readLocalAnswers());
  const [startedAtMs, setStartedAtMs] = useState(attemptInfo ? new Date(attemptInfo.started_at).getTime() : null);
  const [expiresAtMs, setExpiresAtMs] = useState(attemptInfo ? new Date(attemptInfo.expires_at).getTime() : null);
  const [now, setNow] = useState(Date.now());
  const [attemptId, setAttemptId] = useState(attemptInfo?.attempt_id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(()=> setNow(Date.now()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);
  useEffect(() => { saveLocalAnswers(answers); }, [answers]);

  const timeLeftMs = useMemo(() => {
    if (!expiresAtMs) return null;
    return Math.max(0, expiresAtMs - now);
  }, [expiresAtMs, now]);

  useEffect(() => {
    if (stage !== 'running' || !attemptId) return;
    if (timeLeftMs === null) return;
    if (timeLeftMs <= 0 && !isSubmitting) {
      submitAttemptRemote(attemptId).catch(console.error);
    }
  }, [timeLeftMs, stage, attemptId, isSubmitting]);

  async function apiFetch(path, opts = {}) {
    const headers = opts.headers ? {...opts.headers} : {};
    const t = token || readToken();
    if (t) headers['Authorization'] = Bearer ;
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(${API_BASE}, { ...opts, headers });
    if (!res.ok) {
      const txt = await res.text().catch(()=>null);
      let err = new Error('API error: ' + (txt || res.status));
      err.status = res.status;
      err.body = txt;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  async function createCandidateAndSave(name, email) {
    const data = await apiFetch('/candidates', { method: 'POST', body: { name, email } });
    if (data.token) { saveToken(data.token); setToken(data.token); }
    return data;
  }

  async function startAttemptFlow(testId = 1) {
    try {
      if (!token) {
        const name = candidateName?.trim(); const email = candidateEmail?.trim();
        if (!name || !email) { alert('Please enter name and email before starting the test.'); return; }
        await createCandidateAndSave(name, email);
      }
      const start = await apiFetch(/tests//start, { method: 'POST' });
      const ai = { attempt_id: start.attempt_id, started_at: start.started_at, expires_at: start.expires_at, test_id: testId };
      saveAttemptInfo(ai); setAttemptInfo(ai); setAttemptId(start.attempt_id);
      setStartedAtMs(new Date(start.started_at).getTime()); setExpiresAtMs(new Date(start.expires_at).getTime());
      setStage('running');
      const qres = await apiFetch(/tests//questions);
      setQuestions(qres.questions || []);
    } catch (e) {
      console.error('Failed to start attempt', e);
      alert('Failed to start test: ' + (e.message || JSON.stringify(e)));
    }
  }

  function localSaveAnswer(qId, choiceIdx) {
    setAnswers(prev => {
      const next = {...prev, [qId]: { choiceIndex: choiceIdx, savedAt: Date.now() }};
      saveLocalAnswers(next);
      return next;
    });
  }

  async function saveAnswerRemote(attemptIdLocal, questionId, selectedChoiceIndex) {
    try {
      await apiFetch(/attempts//answer, { method: 'POST', body: { question_id: questionId, selected_choice_index: selectedChoiceIndex } });
      return true;
    } catch (e) {
      console.warn('remote save failed', e);
      return false;
    }
  }

  function handleSelect(qId, choiceIdx) {
    localSaveAnswer(qId, choiceIdx);
    const ai = readAttemptInfo();
    if (ai?.attempt_id) {
      saveAnswerRemote(ai.attempt_id, qId, choiceIdx).catch(()=>{});
    }
  }

  async function submitAttemptRemote(attemptIdLocal) {
    if (!attemptIdLocal) throw new Error('No attempt id');
    setIsSubmitting(true);
    try {
      const res = await apiFetch(/attempts//submit, { method: 'POST' });
      setScoreResult(res);
      setStage('done');
      return res;
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTime(ms) {
    if (ms == null) return '--:--';
    const s = Math.floor(ms/1000);
    const m = Math.floor(s/60);
    const sec = s % 60;
    return ${m}:;
  }

  return (
    <div style={{ maxWidth: 900, margin: 20, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Online Assessment — Basic</h1>

      {stage === 'intro' && (
        <div>
          <p>Test: Sample Test (30 questions). Duration: 5 minutes (dev).</p>
          <div style={{ marginTop: 12, maxWidth: 480 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Your name
              <input type="text" value={candidateName} onChange={(e)=>setCandidateName(e.target.value)} placeholder="Enter your name" style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }} />
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Your email
              <input type="email" value={candidateEmail} onChange={(e)=>setCandidateEmail(e.target.value)} placeholder="you@example.com" style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }} />
            </label>
            <div style={{ marginTop: 12 }}>
              <button onClick={()=>startAttemptFlow(1)} disabled={!candidateName || !candidateEmail}>Start Test</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#777' }}>The test will create a candidate profile using name & email, then start the timed attempt.</div>
          </div>
        </div>
      )}

      {stage === 'running' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Attempt: {attemptId}</div>
            <div><strong>Time left: {formatTime(timeLeftMs)}</strong></div>
          </div>

          <div style={{ marginTop: 12 }}>
            {questions.length === 0 && <div>Loading questions...</div>}
            {questions.map((q, idx) => (
              <div key={q.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <div><strong>Q {idx+1}:</strong> {q.text}</div>
                <div style={{ marginTop: 8 }}>
                  {q.choices.map((c, ci) => {
                    const selected = answers[q.id] && answers[q.id].choiceIndex === ci;
                    return (
                      <label key={ci} style={{ display: 'block', padding: '6px 0', cursor: 'pointer' }}>
                        <input type="radio" name={q_} checked={selected || false} onChange={()=>handleSelect(q.id, ci)} /> {c}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={()=>submitAttemptRemote(attemptId)} disabled={isSubmitting}>Submit Now</button>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div>
          <h2>Completed</h2>
          {scoreResult ? (
            <div>
              <p>Score: {scoreResult.score} / {scoreResult.total} ({Math.round((scoreResult.score/scoreResult.total)*100)}%)</p>
            </div>
          ) : <div>Submitted — awaiting result...</div>}
          <div style={{ marginTop: 12 }}><button onClick={()=>{ localStorage.clear(); window.location.reload(); }}>Clear & Restart</button></div>
        </div>
      )}

      <hr style={{ marginTop: 20 }} />
      <div style={{ fontSize: 12, color: '#666' }}>
        Notes: This is a minimal dev UI. In production:
        <ul>
          <li>Show candidate name/email input instead of auto-creating</li>
          <li>Handle offline retry queues for autosave</li>
          <li>Use secure auth & HTTPS</li>
        </ul>
      </div>
    </div>
  );
}
