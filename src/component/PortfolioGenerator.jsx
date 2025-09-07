import React, { useState, useEffect, useRef } from "react";

// Portfolio Generator
// Default export: React component that provides a simple Resume -> Portfolio generator
// Features:
// - Paste resume text OR upload a small JSON with structured fields
// - Auto-parses basic sections (Name, Title, Summary, Skills, Projects, Experience, Education, Contact)
// - Live preview with 3 themes (clean, modern, creative)
// - Download generated portfolio as a standalone HTML file
// Tailwind CSS utility classes are used for styling (assumes Tailwind is configured)

export default function PortfolioGenerator() {
  const [inputMode, setInputMode] = useState("paste"); // 'paste' or 'json'
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [theme, setTheme] = useState("clean");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [contact, setContact] = useState({ email: "", phone: "", website: "", linkedin: "" });

  const previewRef = useRef();

  useEffect(() => {
    if (!rawText) return;
    // Try parsing heuristically
    const p = heuristicParse(rawText);
    setParsed(p);
    // Populate editable fields with parsed result
    setName(p.name || "");
    setTitle(p.title || "");
    setSummary(p.summary || "");
    setSkills(p.skills || []);
    setProjects(p.projects || []);
    setExperience(p.experience || []);
    setEducation(p.education || []);
    setContact({ ...contact, ...(p.contact || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  function heuristicParse(text) {
    // Very lightweight parser: split by lines, look for common headings
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
    const joined = lines.join("\n");

    const result = {};
    // Name: first line if it looks like a name (contains space and letters)
    if (lines.length > 0) result.name = lines[0];

    // Title: try second line if short
    if (lines.length > 1 && lines[1].length < 60) result.title = lines[1];

    // Summary: find a paragraph under "Summary" or the first paragraph
    const summaryMatch = joined.match(/Summary[:\-\s]*\n([^\n]{50,300})/i);
    if (summaryMatch) result.summary = summaryMatch[1].trim();
    else {
      // fallback: take the next 2 lines after title as summary if length seems fine
      if (lines.length > 2) result.summary = lines.slice(2, 5).join(" ");
    }

    // Skills: look for lines that start with Skills or a line with commas and short items
    const skillsMatch = joined.match(/Skills[:\-\s]*\n([\s\S]{0,200})/i);
    if (skillsMatch) result.skills = skillsMatch[1].split(/[\n,••;]+/).map(s => s.trim()).filter(Boolean);
    else {
      // try to find a short line of comma separated tokens
      const commaLine = lines.find(l => l.split(",").length >= 3 && l.length < 200);
      if (commaLine) result.skills = commaLine.split(",").map(s => s.trim()).filter(Boolean);
    }

    // Projects: crude detect 'Projects' heading
    const projMatch = joined.split(/Projects[:\-]/i)[1];
    if (projMatch) {
      const maybe = projMatch.split(/\n\n+/)[0];
      result.projects = maybe.split(/\n/).map(s => s.trim()).filter(Boolean).slice(0, 6);
    }

    // Experience: find Experience heading
    const expMatch = joined.split(/Experience[:\-]/i)[1];
    if (expMatch) {
      const block = expMatch.split(/\n\n+/)[0];
      result.experience = block.split(/\n/).map(s => s.trim()).filter(Boolean).slice(0, 6);
    }

    // Education: find Education heading
    const eduMatch = joined.split(/Education[:\-]/i)[1];
    if (eduMatch) {
      const block = eduMatch.split(/\n\n+/)[0];
      result.education = block.split(/\n/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    }

    // Contact info: simple email/linkedin detection
    const emailMatch = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) result.contact = { ...(result.contact || {}), email: emailMatch[0] };
    const linkedinMatch = joined.match(/linkedin\.com\/[A-z0-9\-_/]+/i);
    if (linkedinMatch) result.contact = { ...(result.contact || {}), linkedin: linkedinMatch[0] };

    return result;
  }

  function handleJSONUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        // Expect fields: name, title, summary, skills (array), projects (array), experience (array), education (array), contact (object)
        setParsed(obj);
        setName(obj.name || "");
        setTitle(obj.title || "");
        setSummary(obj.summary || "");
        setSkills(obj.skills || []);
        setProjects(obj.projects || []);
        setExperience(obj.experience || []);
        setEducation(obj.education || []);
        setContact(obj.contact || {});
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  function addSkill(skill) {
    if (!skill) return;
    setSkills(prev => [...prev, skill]);
  }

  function downloadHTML() {
    const html = buildStandaloneHTML({ name, title, summary, skills, projects, experience, education, contact, theme });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name||"portfolio").replace(/\s+/g, "_")}_portfolio.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function buildStandaloneHTML(data) {
    // Minimal standalone HTML with inline styles (Tailwind not included) — simple clean style
    const { name, title, summary, skills, projects, experience, education, contact, theme } = data;
    const style = `
      body{font-family:Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:24px;}
      .hero{display:flex;justify-content:space-between;align-items:center}
      .skills{display:flex;flex-wrap:wrap;gap:8px}
      .chip{border-radius:999px;padding:6px 12px;border:1px solid #e5e7eb}
      .section{margin-top:18px}
      h1{font-size:28px;margin:0}
      h2{font-size:18px;margin:0}
      .card{border-radius:8px;padding:12px;border:1px solid #eaeaea;margin-top:8px}
    `;
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${name} — Portfolio</title>
<style>${style}</style>
</head>
<body>
<div class="hero">
  <div>
    <h1>${escapeHtml(name || "Your Name")}</h1>
    <p style="opacity:0.8">${escapeHtml(title || "Your Title")}</p>
  </div>
  <div style="text-align:right">
    <div>${contact?.email ? `<div>${escapeHtml(contact.email)}</div>` : ""}</div>
    <div>${contact?.website ? `<div>${escapeHtml(contact.website)}</div>` : ""}</div>
  </div>
</div>

<div class="section">
  <h2>About</h2>
  <div class="card">${escapeHtml(summary || "A short summary about you — edit this and make it shine!")}</div>
</div>

<div class="section">
  <h2>Skills</h2>
  <div class="skills">${(skills||[]).map(s=>`<div class="chip">${escapeHtml(s)}</div>`).join("")}</div>
</div>

<div class="section">
  <h2>Projects</h2>
  ${(projects||[]).map(p=>`<div class="card">${escapeHtml(p)}</div>`).join("")}
</div>

<div class="section">
  <h2>Experience</h2>
  ${(experience||[]).map(e=>`<div class="card">${escapeHtml(e)}</div>`).join("")}
</div>

<div class="section">
  <h2>Education</h2>
  ${(education||[]).map(ed=>`<div class="card">${escapeHtml(ed)}</div>`).join("")}
</div>

</body>
</html>`;
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/[&<>'"]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[c];
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Portfolio Generator</h1>
          <div className="text-sm text-gray-600">Live preview • Downloadable HTML</div>
        </header>

        <main className="grid md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="flex gap-2">
                <button className={`px-3 py-1 rounded ${inputMode==='paste' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setInputMode('paste')}>Paste Resume</button>
                <button className={`px-3 py-1 rounded ${inputMode==='json' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setInputMode('json')}>Upload JSON</button>
              </div>

              {inputMode === 'paste' ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Paste your resume / notes</label>
                  <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} className="mt-2 w-full border rounded p-2" placeholder={`Paste plain text resume here. Use headings like 'Skills:', 'Projects:', 'Experience:' for better parsing.`}></textarea>
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Upload structured JSON</label>
                  <input type="file" accept="application/json" onChange={handleJSONUpload} className="mt-2" />
                  <div className="text-xs text-gray-500 mt-2">Expected JSON sample: {`{name,title,summary,skills:[..],projects:[..],experience:[..],education:[..],contact:{email,website,linkedin}}`}</div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => { setRawText(sampleResume); }} className="px-3 py-2 rounded border">Load sample</button>
                <button onClick={() => { setRawText(''); setParsed(null); }} className="px-3 py-2 rounded border">Clear</button>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm space-y-3">
              <h2 className="text-lg font-medium">Edit content</h2>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Summary</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className="mt-1 w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Skills (comma separated)</label>
                <input value={skills.join(', ')} onChange={(e) => setSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="mt-1 w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Projects (one-per-line)</label>
                <textarea value={projects.join('\n')} onChange={(e) => setProjects(e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean))} rows={4} className="mt-1 w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Experience (one-per-line)</label>
                <textarea value={experience.join('\n')} onChange={(e) => setExperience(e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean))} rows={4} className="mt-1 w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium">Education (one-per-line)</label>
                <textarea value={education.join('\n')} onChange={(e) => setEducation(e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean))} rows={3} className="mt-1 w-full border rounded p-2" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">Email</label>
                  <input value={contact.email || ''} onChange={(e) => setContact(prev=>({...prev,email:e.target.value}))} className="mt-1 w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm">Website / GitHub</label>
                  <input value={contact.website || ''} onChange={(e) => setContact(prev=>({...prev,website:e.target.value}))} className="mt-1 w-full border rounded p-2" />
                </div>
              </div>

            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-lg font-medium">Theme & export</h2>
              <div className="flex gap-2 mt-2">
                <select value={theme} onChange={(e)=>setTheme(e.target.value)} className="border rounded p-2">
                  <option value="clean">Clean</option>
                  <option value="modern">Modern</option>
                  <option value="creative">Creative</option>
                </select>
                <button onClick={downloadHTML} className="px-3 py-2 rounded bg-green-600 text-white">Download HTML</button>
                <button onClick={() => { navigator.clipboard?.writeText(buildStandaloneHTML({ name, title, summary, skills, projects, experience, education, contact, theme })); alert('HTML copied to clipboard'); }} className="px-3 py-2 rounded border">Copy HTML</button>
              </div>

              <div className="text-xs text-gray-500 mt-2">Tip: After downloading, open the HTML file and host it on GitHub Pages / Netlify for a professional link to post on LinkedIn.</div>
            </div>

          </section>

          <section>
            <div className="sticky top-6">
              <div className="bg-white p-4 rounded shadow-sm" ref={previewRef}>
                <RenderPreview theme={theme} name={name} title={title} summary={summary} skills={skills} projects={projects} experience={experience} education={education} contact={contact} />
              </div>
              <div className="mt-4 text-xs text-gray-500">Live preview — tweak fields on the left and click Download HTML to export a standalone page.</div>
            </div>
          </section>
        </main>

        <footer className="mt-6 text-center text-gray-500 text-sm">Made with ♥ — Customize the template for a unique LinkedIn post.</footer>
      </div>
    </div>
  );
}

function RenderPreview({ theme, name, title, summary, skills, projects, experience, education, contact }) {
  const themeBg = theme === 'modern' ? 'bg-gradient-to-r from-white to-gray-50' : theme === 'creative' ? 'bg-gradient-to-r from-purple-50 to-pink-50' : '';
  return (
    <div className={`${themeBg} p-4 rounded`}>
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">{(name||'Y').slice(0,2).toUpperCase()}</div>
        <div>
          <div className="text-xl font-semibold">{name || 'Your Name'}</div>
          <div className="text-sm text-gray-600">{title || 'Your Professional Title'}</div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium">About</h3>
        <p className="text-sm text-gray-700 mt-2">{summary || 'A short, punchy summary: who you are, what you build, and the impact you create. Example: "Frontend developer who builds scalable apps with delightful UX — shipped 10+ products used by 5k+ users."'}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-sm font-medium">Skills</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {(skills||[]).length ? skills.map((s,i)=>(<span key={i} className="text-xs border rounded-full px-2 py-1">{s}</span>)) : <span className="text-xs text-gray-400">Add skills</span>}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium">Contact</h4>
          <div className="mt-2 text-sm text-gray-700">
            {contact?.email ? <div>{contact.email}</div> : <div className="text-gray-400">Email</div>}
            {contact?.website ? <div>{contact.website}</div> : null}
            {contact?.linkedin ? <div>{contact.linkedin}</div> : null}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium">Projects</h4>
        <div className="mt-2 space-y-2">
          {(projects||[]).length ? projects.map((p,i)=>(<div key={i} className="border rounded p-2 text-sm">{p}</div>)) : <div className="text-gray-400 text-sm">Add project highlights (title — one-line description — tech)</div>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-sm font-medium">Experience</h4>
          <div className="mt-2 space-y-2 text-sm">
            {(experience||[]).length ? experience.map((e,i)=>(<div key={i} className="border rounded p-2">{e}</div>)) : <div className="text-gray-400">Add roles & impact</div>}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium">Education</h4>
          <div className="mt-2 space-y-2 text-sm">
            {(education||[]).length ? education.map((ed,i)=>(<div key={i} className="border rounded p-2">{ed}</div>)) : <div className="text-gray-400">Add degrees or certifications</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const sampleResume = `Anurag Singh
Frontend Developer

Summary:
Frontend developer with experience building React & React Native apps. Passionate about building delightful user experiences, performance, and clean code.

Skills:
React, React Native, JavaScript, TypeScript, Redux, Tailwind CSS, Node.js, Firebase

Projects:
RecipePro — a recipe app with offline support and animations. (React Native)
Resume-to-Website Generator — converts resumes into portfolio sites. (React)

Experience:
Frontend Developer @ Edunext — Built dashboard & auth flows. Improved app performance.

Education:
MCA — ABC University

Contact:
anurag@example.com
linkedin.com/in/anurag-example`
