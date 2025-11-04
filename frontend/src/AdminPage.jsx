import React, { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function AdminPage() {
  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState('');
  const [choices, setChoices] = useState(['','','','']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [testTitle, setTestTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  async function fetchQuestions(){ const res = await fetch(${API_BASE}/admin/questions); const data = await res.json(); setQuestions(data); }
  useEffect(()=>{ fetchQuestions(); },[]);

  async function addQuestion(){
    if (!text.trim() || choices.some(c=>!c.trim())){ alert('Please fill question text and all choices'); return; }
    const res = await fetch(${API_BASE}/admin/questions, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, choices, correct_choice_index: correctIndex }) });
    if (!res.ok){ alert('Failed to add question'); return; }
    setText(''); setChoices(['','','','']); await fetchQuestions();
  }

  async function addTest(){
    if (!testTitle.trim() || selectedIds.length===0){ alert('Please enter a test title and select questions'); return; }
    const res = await fetch(${API_BASE}/admin/tests, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: testTitle, duration_seconds: 300, question_ids: selectedIds }) });
    const data = await res.json();
    alert('Test created! ID: ' + data.id); setTestTitle(''); setSelectedIds([]);
  }

  return (
    <div style={{ maxWidth:900, margin:'20px auto', fontFamily:'Inter, sans-serif' }}>
      <h1>🧑‍💼 Admin Panel</h1>

      <section style={{ borderBottom:'1px solid #ccc', marginBottom:20, paddingBottom:20 }}>
        <h2>Add Question</h2>
        <div style={{ marginBottom:10 }}>
          <label> Question text: <textarea value={text} onChange={(e)=>setText(e.target.value)} rows="2" style={{ width:'100%', marginTop:6 }} /></label>
        </div>

        {choices.map((c,i)=>(
          <div key={i} style={{ marginBottom:6 }}>
            <label> Choice {i+1}: <input type="text" value={c} onChange={(e)=>setChoices(prev=>{ const next=[...prev]; next[i]=e.target.value; return next; })} style={{ width:'80%' }} />
              <input type="radio" checked={correctIndex===i} onChange={()=>setCorrectIndex(i)} name="correct" style={{ marginLeft:8 }} /> Correct
            </label>
          </div>
        ))}

        <button onClick={addQuestion}>Add Question</button>
      </section>

      <section style={{ borderBottom:'1px solid #ccc', marginBottom:20, paddingBottom:20 }}>
        <h2>All Questions ({questions.length})</h2>
        {questions.map(q=>(
          <div key={q.id} style={{ border:'1px solid #ddd', padding:10, marginBottom:8, borderRadius:6, background: selectedIds.includes(q.id) ? '#def' : '#f9f9f9' }} onClick={()=>{ setSelectedIds(prev => prev.includes(q.id) ? prev.filter(id=>id!==q.id) : [...prev,q.id]); }}>
            <strong>Q{q.id}:</strong> {q.text}
            <ul style={{ marginTop:6 }}>
              {q.choices.map((c,i)=> <li key={i} style={{ color: i===q.correct_choice_index ? 'green' : 'inherit', fontWeight: i===q.correct_choice_index ? 'bold' : 'normal' }}>{c}</li> )}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2>Create New Test</h2>
        <label> Test Title: <input type="text" value={testTitle} onChange={(e)=>setTestTitle(e.target.value)} style={{ width:'60%', marginRight:10 }} /></label>
        <button onClick={addTest}>Create Test</button>
      </section>
    </div>
  );
}
