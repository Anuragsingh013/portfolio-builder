import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const [inputMode, setInputMode] = useState("paste");
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
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    github: ""
  });
  const [activeTab, setActiveTab] = useState("personal");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [sections, setSections] = useState({
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    contact: true
  });
  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    dribbble: "",
    behance: "",
    instagram: ""
  });
  const [currentProjectImage, setCurrentProjectImage] = useState(null);
  const [showHostingModal, setShowHostingModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    if (!rawText) return;
    const p = heuristicParse(rawText);
    setParsed(p);
    setName(p.name || "");
    setTitle(p.title || "");
    setSummary(p.summary || "");
    setSkills(p.skills || []);
    setProjects(p.projects || []);
    setExperience(p.experience || []);
    setEducation(p.education || []);
    setContact({ ...contact, ...(p.contact || {}) });
  }, [rawText]);

  function heuristicParse(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
    const joined = lines.join("\n");

    const result = {};

    // Name detection
    if (lines.length > 0 && /^[A-Za-z\s]{3,}$/.test(lines[0])) {
      result.name = lines[0];
    }

    // Title detection
    if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes('@')) {
      result.title = lines[1];
    }

    // Summary detection
    const summaryMatch = joined.match(/(?:summary|about|profile)[:\-\s]*\n([^\n]{50,300})/i);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    } else if (lines.length > 2) {
      result.summary = lines.slice(2, 5).join(" ");
    }

    // Skills detection
    const skillsMatch = joined.match(/(?:skills|technologies|expertise)[:\-\s]*\n([\s\S]{0,400})/i);
    if (skillsMatch) {
      const skillsText = skillsMatch[1].split(/\n/)[0];
      result.skills = skillsText.split(/[\n,••;|]+/).map(s => s.trim()).filter(Boolean);
    }

    // Projects detection
    const projMatch = joined.match(/(?:projects|portfolio)[:\-\s]*(.*?)(?=\n\s*\n|$)/is);
    if (projMatch) {
      const projectsText = projMatch[1];
      result.projects = projectsText.split(/\n\s*-?\s*/).filter(p => p.trim().length > 0);
    }

    // Experience detection
    const expMatch = joined.match(/(?:experience|work|employment)[:\-\s]*(.*?)(?=\n\s*\n|$)/is);
    if (expMatch) {
      const expText = expMatch[1];
      result.experience = expText.split(/\n\s*-?\s*/).filter(e => e.trim().length > 0);
    }

    // Education detection
    const eduMatch = joined.match(/(?:education|qualifications)[:\-\s]*(.*?)(?=\n\s*\n|$)/is);
    if (eduMatch) {
      const eduText = eduMatch[1];
      result.education = eduText.split(/\n\s*-?\s*/).filter(e => e.trim().length > 0);
    }

    // Contact info detection
    result.contact = {};
    const emailMatch = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) result.contact.email = emailMatch[0];

    const phoneMatch = joined.match(/(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/);
    if (phoneMatch) result.contact.phone = phoneMatch[0];

    const linkedinMatch = joined.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[A-z0-9\-_\/]+/i);
    if (linkedinMatch) result.contact.linkedin = linkedinMatch[0];

    const githubMatch = joined.match(/(https?:\/\/)?(www\.)?github\.com\/[A-z0-9\-_\/]+/i);
    if (githubMatch) result.contact.github = githubMatch[0];

    const websiteMatch = joined.match(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/i);
    if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
      result.contact.website = websiteMatch[0];
    }

    return result;
  }

  // function handleJSONUpload(e) {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   if (file.size > 100000) {
  //     showToast("File size too large. Please upload a smaller file.", "error");
  //     return;
  //   }

  function handleJSONUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // allow max 1.5 MB
    if (file.size > 2572864) {
      showToast("File size too large. Please upload a file under 1.5 MB.", "error");
      return;
    }




    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        setParsed(obj);
        setName(obj.name || "");
        setTitle(obj.title || "");
        setSummary(obj.summary || "");
        setSkills(obj.skills || []);
        setProjects(obj.projects || []);
        setExperience(obj.experience || []);
        setEducation(obj.education || []);
        setContact({ ...contact, ...obj.contact });
        if (obj.profileImage) setProfileImage(obj.profileImage);
        if (obj.socialLinks) setSocialLinks({ ...socialLinks, ...obj.socialLinks });
        if (obj.sections) setSections({ ...sections, ...obj.sections });
        showToast("JSON uploaded successfully!");
      } catch (err) {
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      showToast("Please select an image file", "error");
      return;
    }

    // if (file.size > 500000) {
    // allow max 1.5 MB
    if (file.size > 2572864) {
      showToast("Image size too large. Please select a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target.result);
      showToast("Profile image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  }

  function handleProjectImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      showToast("Please select an image file", "error");
      return;
    }

    // if (file.size > 500000) {
    // allow max 1.5 MB
    if (file.size > 1572864) {
      showToast("Image size too large. Please select a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCurrentProjectImage(event.target.result);
      showToast("Project image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  }

  function addSkill() {
    const skillInput = document.getElementById('skillInput');
    const skillLevel = document.getElementById('skillLevel');
    const skill = skillInput.value.trim();
    const level = skillLevel.value;

    if (skill && !skills.some(s => s.name === skill)) {
      setSkills(prev => [...prev, { name: skill, level: level }]);
      skillInput.value = '';
    }
  }

  function removeSkill(index) {
    setSkills(prev => prev.filter((_, i) => i !== index));
  }

  function addProject() {
    const projectName = document.getElementById('projectName');
    const projectDesc = document.getElementById('projectDescription');
    const projectLink = document.getElementById('projectLink');

    const name = projectName.value.trim();
    const description = projectDesc.value.trim();
    const link = projectLink.value.trim();

    if (name) {
      setProjects(prev => [...prev, {
        name,
        description,
        link,
        image: currentProjectImage,
        id: Date.now()
      }]);
      projectName.value = '';
      projectDesc.value = '';
      projectLink.value = '';
      setCurrentProjectImage(null);
      showToast("Project added successfully!");
    } else {
      showToast("Project name is required", "error");
    }
  }

  function removeProject(index) {
    setProjects(prev => prev.filter((_, i) => i !== index));
  }

  function addExperience() {
    const expRole = document.getElementById('experienceRole');
    const expCompany = document.getElementById('experienceCompany');
    const expPeriod = document.getElementById('experiencePeriod');
    const expDesc = document.getElementById('experienceDescription');

    const role = expRole.value.trim();
    const company = expCompany.value.trim();
    const period = expPeriod.value.trim();
    const description = expDesc.value.trim();

    if (role && company) {
      setExperience(prev => [...prev, { role, company, period, description }]);
      expRole.value = '';
      expCompany.value = '';
      expPeriod.value = '';
      expDesc.value = '';
    }
  }

  function removeExperience(index) {
    setExperience(prev => prev.filter((_, i) => i !== index));
  }

  function addEducation() {
    const eduDegree = document.getElementById('educationDegree');
    const eduInstitution = document.getElementById('educationInstitution');
    const eduPeriod = document.getElementById('educationPeriod');
    const eduDesc = document.getElementById('educationDescription');

    const degree = eduDegree.value.trim();
    const institution = eduInstitution.value.trim();
    const period = eduPeriod.value.trim();
    const description = eduDesc.value.trim();

    if (degree && institution) {
      setEducation(prev => [...prev, { degree, institution, period, description }]);
      eduDegree.value = '';
      eduInstitution.value = '';
      eduPeriod.value = '';
      eduDesc.value = '';
    }
  }

  function removeEducation(index) {
    setEducation(prev => prev.filter((_, i) => i !== index));
  }

  function downloadHTML() {
    try {
      const html = buildStandaloneHTML({
        name,
        title,
        summary,
        skills,
        projects,
        experience,
        education,
        contact,
        socialLinks,
        profileImage,
        theme,
        sections
      });

      // Create a Blob with proper MIME type
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(name || "portfolio").toLowerCase().replace(/\s+/g, "_")}_portfolio.html`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      showToast("Portfolio downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      showToast("Failed to download portfolio: " + error.message, "error");
    }
  }

  function exportJSON() {
    const data = {
      name,
      title,
      summary,
      skills,
      projects,
      experience,
      education,
      contact,
      socialLinks,
      profileImage,
      sections,
      theme
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "portfolio").toLowerCase().replace(/\s+/g, "_")}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON exported successfully!");
  }

  // Enhanced theme styles with hover effects
  function buildStandaloneHTML(data) {
    const { name, title, summary, skills, projects, experience, education, contact, socialLinks, profileImage, theme, sections } = data;

    // Enhanced theme styles with hover effects
const themeStyles = {
  clean: `
    html { scroll-behavior: smooth; scroll-padding-top: 24px; } 
    body { 
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 2rem; 
      background: #f9fafb; 
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      // margin-bottom: 2rem; 
      padding-bottom: 2rem; 
      // border-bottom: 2px solid #e5e7eb; 
    }
    .profile-img { 
      width: 200px; 
      height: 200px; 
      border-radius: 50%; 
      object-fit: cover; 
      border: 1px solid #4f46e5; 
      transition: all 0.3s ease; 
    }
    .profile-img:hover { 
      transform: scale(1.07); 
      box-shadow: 0 15px 35px rgba(79, 70, 229, 0.3); 
    }
    h1 { 
      font-size: 3rem; 
      margin: 0; 
      font-weight: 700; 
      color: #111827; 
    }
    h2 { 
      font-size: 2rem; 
      margin: 2.5rem 0 1.5rem; 
      color: #374151; 
      border-left: 4px solid #4f46e5; 
      padding-left: 1.5rem; 
      font-weight: 600;
    }
    .section { margin-bottom: 3rem; }
    
    .skills { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 0.8rem; 
      margin: 1.5rem 0; 
    }
    .skill { 
      background: #eef2ff; 
      color: #3730a3; 
      padding: 0.7rem 1.2rem; 
      border-radius: 9999px; 
      font-size: 0.9rem; 
      font-weight: 500;
      transition: all 0.3s ease; 
      display: flex;
      flex-direction: column;
    }
    .skill:hover { 
      background: #e0e7ff; 
      transform: translateY(-3px) scale(1.05); 
      box-shadow: 0 5px 15px rgba(79, 70, 229, 0.2);
    }
    .skill-level { 
      height: 4px; 
      background: rgba(79, 70, 229, 0.3); 
      border-radius: 2px; 
      margin-top: 6px; 
      overflow: hidden;
    }
    .skill-level-inner { 
      height: 100%; 
      background: #4f46e5; 
      border-radius: 2px; 
      transition: width 0.8s ease;
    }
    
    .card { 
      background: white; 
      border-radius: 12px; 
      padding: 2rem; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.05); 
      margin-bottom: 1.5rem; 
      transition: all 0.3s ease; 
      border: 1px solid #f3f4f6;
    }
    .card:hover { 
      transform: translateY(-8px); 
      box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
      border-color: #e5e7eb;
    }
    
    .contact { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 1.5rem; 
      margin: 1.5rem 0; 
    }
    .contact a, .social-links a { 
      color: #4f46e5; 
      text-decoration: none; 
      font-weight: 500;
      display: flex; 
      align-items: center; 
      gap: 0.7rem; 
      transition: all 0.3s ease; 
      padding: 0.5rem 0;
    }
    .contact a:hover, .social-links a:hover { 
      color: #3730a3; 
      transform: translateY(-3px); 
      text-decoration: underline; 
    }
    .social-links { 
      display: flex; 
      gap: 1.5rem; 
      margin-top: 1.5rem; 
      flex-wrap: wrap;
    }
    
    // .nav { 
    //   display: flex; 
    //   gap: 2rem; 
    //   margin: 3rem 0; 
    //   padding: 1.5rem; 
    //   background: white; 
    //   border-radius: 12px; 
    //   box-shadow: 0 2px 6px rgba(0,0,0,0.05); 
    //   flex-wrap: wrap;
    //   justify-content: center;
    // }
    // .nav a { 
    //   color: #4f46e5; 
    //   text-decoration: none; 
    //   font-weight: 500; 
    //   transition: all 0.3s ease; 
    //   padding: 0.5rem 1rem;
    //   border-radius: 8px;
    // }
    // .nav a:hover { 
    //   color: #3730a3; 
    //   background: #f8fafc;
    //   transform: translateY(-2px); 
    // }


      /* Compact nav (no large white card) */
  .nav {
    display: flex;
    gap: 0.75rem;
    margin: 0.9rem 0 1.1rem;          /* compact spacing */
    padding: 0;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .nav a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 600;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    background: rgba(79,70,229,0.06);
    transition: background .18s ease, transform .12s ease;
  }
  .nav a:hover {
    background: rgba(79,70,229,0.12);
    transform: translateY(-2px);
  }
    
    .project-link { 
      color: #4f46e5; 
      text-decoration: none; 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      transition: all 0.3s ease; 
      font-weight: 500;
    }
    .project-link:hover { 
      color: #3730a3; 
      text-decoration: underline; 
      transform: translateY(-2px); 
    }
    .project-image { 
      max-width: 100%; 
      height: 200px;
      object-fit: cover;
      border-radius: 12px; 
      margin-bottom: 1.5rem; 
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; gap: 2rem; }
      .profile-img { width: 150px; height: 150px; }
      h1 { font-size: 2.5rem; }
      .contact, .social-links, .nav { justify-content: center; }
      .skills { justify-content: center; }
    }
  `,
  
  modern: `
      html { scroll-behavior: smooth; scroll-padding-top: 24px; } 
    body { 
      font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif; 
      line-height: 1.6; 
      color: #2d3748; 
      background: #f8fafc; 
      padding: 2rem; 
      min-height: 100vh;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      // margin-bottom: 4rem; 
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .profile-img { 
      width: 200px; 
      height: 200px; 
      border-radius: 50%; 
      object-fit: cover; 
      border: 1px solid white; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.1); 
      transition: all 0.3s ease; 
    }
    .profile-img:hover { 
      transform: scale(1.08); 
      box-shadow: 0 12px 30px rgba(0,0,0,0.15); 
    }
    h1 { 
      font-size: 3.5rem; 
      margin: 0; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      background-clip: text;
      font-weight: 700;
    }
    h2 { 
      font-size: 2.2rem; 
      margin: 3rem 0 2rem; 
      position: relative; 
      padding-bottom: 1rem; 
      color: #2d3748;
      font-weight: 600;
    }
    h2:after { 
      content: ''; 
      position: absolute; 
      bottom: 0; 
      left: 0; 
      width: 80px; 
      height: 5px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      border-radius: 3px; 
    }
    .section { margin-bottom: 3rem; }
    
    .skills { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 1.2rem; 
      margin: 2rem 0; 
    }
    .skill { 
      background: white; 
      padding: 1.2rem; 
      border-radius: 12px; 
      font-size: 0.95rem; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
      border: 1px solid #e2e8f0; 
      display: flex; 
      flex-direction: column; 
      transition: all 0.3s ease; 
    }
    .skill:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 12px 24px rgba(0,0,0,0.1); 
      border-color: #667eea; 
    }
    .skill-level { 
      height: 6px; 
      background: #e2e8f0; 
      border-radius: 3px; 
      margin-top: 8px; 
      overflow: hidden;
    }
    .skill-level-inner { 
      height: 100%; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      border-radius: 3px; 
      transition: width 0.8s ease;
    }
    
    .card { 
      background: white; 
      border-radius: 16px; 
      padding: 2.2rem; 
      box-shadow: 0 6px 12px rgba(0,0,0,0.06); 
      margin-bottom: 1.8rem; 
      transition: all 0.3s ease; 
    }
    .card:hover { 
      transform: translateY(-8px); 
      box-shadow: 0 20px 40px rgba(0,0,0,0.12); 
    }
    
    .contact { 
      display: flex; 
      gap: 2rem; 
      flex-wrap: wrap; 
      margin: 2rem 0; 
    }
    .contact a, .social-links a { 
      color: #667eea; 
      text-decoration: none; 
      display: flex; 
      align-items: center; 
      gap: 0.8rem; 
      transition: all 0.3s ease; 
      font-weight: 500;
    }
    .contact a:hover, .social-links a:hover { 
      color: #5a67d8; 
      transform: translateY(-3px); 
    }
    .social-links { 
      display: flex; 
      gap: 2rem; 
      margin-top: 2rem; 
    }
    
    .nav { 
      display: flex; 
      gap: 2.5rem; 
      margin: 3rem 0; 
      padding: 1.5rem; 
      background: white; 
      border-radius: 16px; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
      justify-content: center;
      flex-wrap: wrap;
    }
    .nav a { 
      color: #667eea; 
      text-decoration: none; 
      font-weight: 500; 
      transition: all 0.3s ease; 
      padding: 0.7rem 1.2rem;
      border-radius: 8px;
    }
    .nav a:hover { 
      color: #5a67d8; 
      text-decoration: underline; 
      background: #f8fafc;
      transform: translateY(-2px); 
    }
    
    .project-link { 
      color: #667eea; 
      text-decoration: none; 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      transition: all 0.3s ease; 
      font-weight: 500;
    }
    .project-link:hover { 
      color: #5a67d8; 
      text-decoration: underline; 
      transform: translateY(-2px); 
    }
    .project-image { 
      max-width: 100%; 
      height: 220px;
      object-fit: cover;
      border-radius: 12px; 
      margin-bottom: 1.5rem; 
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; gap: 2rem; padding: 2rem; }
      h1 { font-size: 2.8rem; }
      .contact, .social-links { justify-content: center; }
      .nav { flex-wrap: wrap; justify-content: center; }
      .skills { grid-template-columns: 1fr; }
    }
  `,
  
  creative: `
       html { scroll-behavior: smooth; scroll-padding-top: 24px; } 
    body { 
      font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif; 
      line-height: 1.6; 
      color: #2d3748; 
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
      padding: 2rem; 
      min-height: 100vh;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      // margin-bottom: 4rem; 
      padding: 3rem; 
      background: white; 
      border-radius: 24px; 
      box-shadow: 0 15px 35px rgba(0,0,0,0.08); 
    }
    .profile-img { 
      width: 200px; 
      height: 200px; 
      border-radius: 50%; 
      object-fit: cover; 
      border: 1px solid white; 
      box-shadow: 0 12px 30px rgba(0,0,0,0.12); 
      transition: all 0.3s ease; 
    }
    .profile-img:hover { 
      transform: scale(1.08) rotate(3deg); 
      box-shadow: 0 20px 50px rgba(0,0,0,0.2); 
    }
    h1 { 
      font-size: 3.5rem; 
      margin: 0; 
      color: #1e40af; 
      font-weight: 700;
    }
    h2 { 
      font-size: 2.5rem; 
      margin: 3rem 0 2rem; 
      color: #3730a3; 
      position: relative; 
      display: inline-block; 
      font-weight: 600;
    }
    h2:after { 
      content: ''; 
      position: absolute; 
      bottom: -8px; 
      left: 0; 
      width: 100%; 
      height: 8px; 
      background: linear-gradient(90deg, #a855f7, #ec4899); 
      border-radius: 4px; 
    }
    .section { margin-bottom: 3rem; }
    
    .skills { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 1rem; 
      margin: 2rem 0; 
      justify-content: center;
    }
    .skill { 
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
      color: white; 
      padding: 0.8rem 1.5rem; 
      border-radius: 9999px; 
      font-size: 0.95rem; 
      box-shadow: 0 6px 15px rgba(168, 85, 247, 0.25); 
      display: flex; 
      flex-direction: column; 
      transition: all 0.3s ease; 
      font-weight: 500;
    }
    .skill:hover { 
      transform: translateY(-5px) scale(1.08); 
      box-shadow: 0 15px 30px rgba(168, 85, 247, 0.4); 
    }
    .skill-level { 
      height: 4px; 
      background: rgba(255,255,255,0.3); 
      border-radius: 2px; 
      margin-top: 6px; 
      overflow: hidden;
    }
    .skill-level-inner { 
      height: 100%; 
      background: white; 
      border-radius: 2px; 
      transition: width 0.8s ease;
    }
    
    .card { 
      background: white; 
      border-radius: 20px; 
      padding: 2.5rem; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.06); 
      margin-bottom: 2rem; 
      border-left: 8px solid #a855f7; 
      transition: all 0.3s ease; 
    }
    .card:hover { 
      transform: translateY(-10px) rotate(1deg); 
      box-shadow: 0 25px 50px rgba(0,0,0,0.12); 
      border-left: 8px solid #ec4899; 
    }
    
    .contact { 
      display: flex; 
      gap: 2rem; 
      flex-wrap: wrap; 
      margin: 2rem 0; 
      justify-content: center;
    }
    .contact a, .social-links a { 
      color: #a855f7; 
      text-decoration: none; 
      font-weight: 600; 
      display: flex; 
      align-items: center; 
      gap: 0.8rem; 
      transition: all 0.3s ease; 
    }
    .contact a:hover, .social-links a:hover { 
      color: #ec4899; 
      transform: translateY(-3px) scale(1.05); 
    }
    .social-links { 
      display: flex; 
      gap: 2rem; 
      margin-top: 2rem; 
      justify-content: center;
    }
    
    .nav { 
      display: flex; 
      gap: 2.5rem; 
      margin: 3rem 0; 
      padding: 1.8rem; 
      background: white; 
      border-radius: 20px; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.06); 
      justify-content: center;
      flex-wrap: wrap;
    }
    .nav a { 
      color: #a855f7; 
      text-decoration: none; 
      font-weight: 600; 
      transition: all 0.3s ease; 
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
    }
    .nav a:hover { 
      color: #ec4899; 
      text-decoration: underline; 
      background: linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%);
      transform: translateY(-2px); 
    }
    
    .project-link { 
      color: #a855f7; 
      text-decoration: none; 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      transition: all 0.3s ease; 
      font-weight: 600;
    }
    .project-link:hover { 
      color: #ec4899; 
      text-decoration: underline; 
      transform: translateY(-2px); 
    }
    .project-image { 
      max-width: 100%; 
      height: 240px;
      object-fit: cover;
      border-radius: 16px; 
      margin-bottom: 1.5rem; 
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; gap: 2.5rem; padding: 2rem; }
      h1 { font-size: 2.8rem; }
      .contact, .social-links { justify-content: center; }
      .nav { flex-wrap: wrap; justify-content: center; }
    }
  `,
  
  professional: `
      html { scroll-behavior: smooth; scroll-padding-top: 24px; } 
    body { 
      font-family: 'Inter', 'SF Pro Text', -apple-system, sans-serif; 
      line-height: 1.6; 
      color: #2d3748; 
      background: #f9fafb; 
      padding: 2rem; 
      min-height: 100vh;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      // margin-bottom: 3.5rem; 
      // padding-bottom: 2.5rem; 
      // border-bottom: 2px solid #e5e7eb; 
    }
    .profile-img { 
      width: 200px; 
      height: 200px; 
      border-radius: 50%; 
      object-fit: cover; 
      border: 4px solid #f3f4f6; 
      transition: all 0.3s ease; 
    }
    .profile-img:hover { 
      transform: scale(1.05); 
      border-color: #3b82f6; 
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25); 
    }
    h1 { 
      font-size: 3rem; 
      margin: 0; 
      color: #111827; 
      font-weight: 700; 
    }
    h2 { 
      font-size: 1.8rem; 
      margin: 3rem 0 1.8rem; 
      color: #374151; 
      font-weight: 600; 
      padding-bottom: 0.8rem; 
      border-bottom: 3px solid #e5e7eb; 
    }
    .section { margin-bottom: 3rem; }
    
    .skills { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
      gap: 1.5rem; 
      margin: 2rem 0; 
    }
    .skill { 
      background: white; 
      padding: 1.5rem; 
      border-radius: 8px; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.08); 
      border-left: 4px solid #3b82f6; 
      display: flex; 
      flex-direction: column; 
      transition: all 0.3s ease; 
    }
    .skill:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 8px 20px rgba(0,0,0,0.12); 
      border-left: 4px solid #2563eb; 
    }
    .skill-level { 
      height: 6px; 
      background: #e5e7eb; 
      border-radius: 3px; 
      margin-top: 10px; 
      overflow: hidden;
    }
    .skill-level-inner { 
      height: 100%; 
      background: #3b82f6; 
      border-radius: 3px; 
      transition: width 0.8s ease;
    }
    
    .card { 
      background: white; 
      border-radius: 10px; 
      padding: 2rem; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.08); 
      margin-bottom: 1.5rem; 
      border-left: 4px solid #3b82f6; 
      transition: all 0.3s ease; 
    }
    .card:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 12px 25px rgba(0,0,0,0.12); 
      border-left: 4px solid #2563eb; 
    }
    
    .contact { 
      display: flex; 
      gap: 2rem; 
      flex-wrap: wrap; 
      margin: 2rem 0; 
    }
    .contact a, .social-links a { 
      color: #3b82f6; 
      text-decoration: none; 
      display: flex; 
      align-items: center; 
      gap: 0.8rem; 
      font-weight: 500; 
      transition: all 0.3s ease; 
    }
    .contact a:hover, .social-links a:hover { 
      color: #2563eb; 
      text-decoration: underline; 
      transform: translateY(-2px); 
    }
    .social-links { 
      display: flex; 
      gap: 2rem; 
      margin-top: 2rem; 
    }
    
    .nav { 
      display: flex; 
      gap: 2.5rem; 
      margin: 3rem 0; 
      padding: 1.5rem 0; 
      border-top: 2px solid #e5e7eb; 
      border-bottom: 2px solid #e5e7eb; 
      justify-content: center;
      flex-wrap: wrap;
    }
    .nav a { 
      color: #4b5563; 
      text-decoration: none; 
      font-weight: 500; 
      transition: all 0.3s ease; 
      padding: 0.7rem 1.2rem;
      border-radius: 6px;
    }
    .nav a:hover { 
      color: #3b82f6; 
      background: #f8fafc;
      transform: translateY(-2px); 
    }
    
    .project-link { 
      color: #3b82f6; 
      text-decoration: none; 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      transition: all 0.3s ease; 
      font-weight: 500;
    }
    .project-link:hover { 
      color: #2563eb; 
      text-decoration: underline; 
      transform: translateY(-2px); 
    }
    .project-image { 
      max-width: 100%; 
      height: 200px;
      object-fit: cover;
      border-radius: 8px; 
      margin-bottom: 1.5rem; 
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; gap: 2rem; }
      .contact, .social-links { justify-content: center; }
      .nav { flex-wrap: wrap; justify-content: center; }
      .skills { grid-template-columns: 1fr; }
      h1 { font-size: 2.5rem; }
    }
  `
};

    const style = themeStyles[theme] || themeStyles.clean;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>${style}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div>
        <h1>${escapeHtml(name || "Your Name")}</h1>
        <p>${escapeHtml(title || "Your Professional Title")}</p>
      </div>
      ${profileImage ?
        `<img src="${profileImage}" alt="${escapeHtml(name)}" class="profile-img">` :
        `<div class="profile-img" style="background: #4f46e5; display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: bold;">
          ${(name || "Y").slice(0, 2).toUpperCase()}
        </div>`
      }
    </header>

    <nav class="nav">
      ${sections.summary ? `<a href="#about">About</a>` : ''}
      ${sections.skills ? `<a href="#skills">Skills</a>` : ''}
      ${sections.projects ? `<a href="#projects">Projects</a>` : ''}
      ${sections.experience ? `<a href="#experience">Experience</a>` : ''}
      ${sections.education ? `<a href="#education">Education</a>` : ''}
      ${sections.contact ? `<a href="#contact">Contact</a>` : ''}
    </nav>

    ${sections.summary ? `
    <section id="about" class="section">
      <h2>About Me</h2>
      <div class="card">
        <p>${escapeHtml(summary || "A short summary about you and your professional background.")}</p>
      </div>
    </section>
    ` : ''}

    ${sections.skills ? `
    <section id="skills" class="section">
      <h2>Skills</h2>
      <div class="skills">
        ${skills.map(skill => `
          <div class="skill">
            <span>${escapeHtml(skill.name || skill)}</span>
            ${skill.level ? `
              <div class="skill-level">
                <div class="skill-level-inner" style="width: ${skill.level}%;"></div>
              </div>
            ` : ''}
          </div>
        `).join("")}
      </div>
    </section>
    ` : ''}

    ${sections.projects ? `
    <section id="projects" class="section">
      <h2>Projects</h2>
      ${projects.map(project => `
        <div class="card">
          ${project.image ? `<img src="${project.image}" alt="${escapeHtml(project.name)}" class="project-image">` : ''}
          <h3>${escapeHtml(project.name || project)}</h3>
          <p>${escapeHtml(project.description || 'Project description')}</p>
          ${project.link ? `<p><a href="${ensureHttp(project.link)}" target="_blank" rel="noopener noreferrer" class="project-link">View Project <i class="fas fa-external-link-alt"></i></a></p>` : ''}
        </div>
      `).join("")}
    </section>
    ` : ''}

    ${sections.experience ? `
    <section id="experience" class="section">
      <h2>Experience</h2>
      ${experience.map(exp => `
        <div class="card">
          <h3>${escapeHtml(exp.role || exp)}</h3>
          <p><strong>${escapeHtml(exp.company || '')}</strong> ${exp.period ? `| ${escapeHtml(exp.period)}` : ''}</p>
          <p>${escapeHtml(exp.description || 'Experience details')}</p>
        </div>
      `).join("")}
    </section>
    ` : ''}

    ${sections.education ? `
    <section id="education" class="section">
      <h2>Education</h2>
      ${education.map(edu => `
        <div class="card">
          <h3>${escapeHtml(edu.degree || edu)}</h3>
          <p><strong>${escapeHtml(edu.institution || '')}</strong> ${edu.period ? `| ${escapeHtml(edu.period)}` : ''}</p>
          <p>${escapeHtml(edu.description || 'Education details')}</p>
        </div>
      `).join("")}
    </section>
    ` : ''}

    ${sections.contact ? `
    <section id="contact" class="section">
      <h2>Contact</h2>
      <div class="contact">
        ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}" target="_blank"><i class="fas fa-envelope"></i> ${escapeHtml(contact.email)}</a>` : ''}
        ${contact.phone ? `<a href="tel:${escapeHtml(contact.phone)}" target="_blank"><i class="fas fa-phone"></i> ${escapeHtml(contact.phone)}</a>` : ''}
        ${contact.website ? `<a href="${ensureHttp(contact.website)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-globe"></i> Website</a>` : ''}
        ${contact.linkedin ? `<a href="${ensureHttp(contact.linkedin)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
        ${contact.github ? `<a href="${ensureHttp(contact.github)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> GitHub</a>` : ''}
      </div>

      <div class="social-links">
        ${socialLinks.twitter ? `<a href="${ensureHttp(socialLinks.twitter)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-twitter"></i> Twitter</a>` : ''}
        ${socialLinks.dribbble ? `<a href="${ensureHttp(socialLinks.dribbble)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-dribbble"></i> Dribbble</a>` : ''}
        ${socialLinks.behance ? `<a href="${ensureHttp(socialLinks.behance)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-behance"></i> Behance</a>` : ''}
        ${socialLinks.instagram ? `<a href="${ensureHttp(socialLinks.instagram)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
      </div>
    </section>
    ` : ''}
  </div>
</body>
</html>`;
  }

// function buildStandaloneHTML(data) {
//     const { name, title, summary, skills, projects, experience, education, contact, socialLinks, profileImage, theme, sections } = data;

//     // Enhanced theme styles with hover effects and animations
//     const themeStyles = {
//       clean: `
//         body {
//           font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
//           line-height: 1.6;
//           color: #1f2937;
//           max-width: 1000px;
//           margin: 0 auto;
//           padding: 2rem;
//           background: #f9fafb;
//         }
//         .container {
//           max-width: 1000px;
//           margin: 0 auto;
//         }
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 2.5rem;
//           padding-bottom: 1.5rem;
//           border-bottom: 2px solid #e5e7eb;
//         }
//         .profile-img {
//           width: 180px;
//           height: 180px;
//           border-radius: 50%;
//           object-fit: cover;
//           border: 3px solid #4f46e5;
//           transition: all 0.3s ease;
//           box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//         }
//         .profile-img:hover {
//           transform: scale(1.07);
//           box-shadow: 0 10px 25px rgba(79, 70, 229, 0.25);
//         }
//         h1 {
//           font-size: 2.8rem;
//           margin: 0;
//           font-weight: 700;
//           color: #111827;
//         }
//         h2 {
//           font-size: 1.6rem;
//           margin: 2rem 0 1rem;
//           color: #374151;
//           border-left: 4px solid #4f46e5;
//           padding-left: 1rem;
//           font-weight: 600;
//         }
//         .section {
//           margin-bottom: 2rem;
//         }
//         .skills {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 0.6rem;
//           margin: 1rem 0;
//         }
//         .skill {
//           background: #eef2ff;
//           color: #3730a3;
//           padding: 0.5rem 1rem;
//           border-radius: 9999px;
//           font-size: 0.9rem;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .skill:hover {
//           background: #e0e7ff;
//           transform: scale(1.05);
//         }
//         .card {
//           background: white;
//           border-radius: 0.75rem;
//           padding: 1.5rem;
//           box-shadow: 0 2px 6px rgba(0,0,0,0.05);
//           margin-bottom: 1.2rem;
//           transition: all 0.3s ease;
//           border: 1px solid #f3f4f6;
//         }
//         .card:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 12px 24px rgba(0,0,0,0.1);
//         }
//         .contact {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 1rem;
//           margin: 1rem 0;
//         }
//         .contact a, .social-links a {
//           color: #4f46e5;
//           text-decoration: none;
//           font-weight: 500;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           transition: all 0.3s ease;
//         }
//         .contact a:hover, .social-links a:hover {
//           color: #3730a3;
//           transform: translateY(-2px);
//           text-decoration: underline;
//         }
//         .project-image {
//           max-width: 100%;
//           border-radius: 8px;
//           margin-bottom: 1rem;
//           transition: all 0.3s ease;
//         }
//         .project-image:hover {
//           transform: scale(1.02);
//           box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
//         }
//         .nav {
//           display: flex;
//           gap: 2rem;
//           margin: 2.5rem 0;
//           padding: 1rem;
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//         }
//         .nav a {
//           color: #4f46e5;
//           text-decoration: none;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .nav a:hover {
//           color: #3730a3;
//           text-decoration: underline;
//           transform: translateY(-2px);
//         }
//         @media (max-width: 768px) {
//           .header {
//             flex-direction: column;
//             text-align: center;
//             gap: 1.5rem;
//           }
//           .contact, .social-links, .nav {
//             justify-content: center;
//           }
//           .nav {
//             flex-wrap: wrap;
//           }
//         }
//       `,
//       modern: `
//         body {
//           font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
//           line-height: 1.6;
//           color: #2d3748;
//           background: #f8fafc;
//           padding: 2rem;
//         }
//         .container {
//           max-width: 1000px;
//           margin: 0 auto;
//         }
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 3rem;
//         }
//         .profile-img {
//           width: 180px;
//           height: 180px;
//           border-radius: 50%;
//           object-fit: cover;
//           border: 3px solid white;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           transition: all 0.3s ease;
//         }
//         .profile-img:hover {
//           transform: scale(1.05);
//           box-shadow: 0 8px 15px rgba(0,0,0,0.2);
//         }
//         h1 {
//           font-size: 2.8rem;
//           margin: 0;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           font-weight: 700;
//         }
//         h2 {
//           font-size: 1.8rem;
//           margin: 2.5rem 0 1.5rem;
//           position: relative;
//           padding-bottom: 0.5rem;
//           font-weight: 600;
//         }
//         h2:after {
//           content: '';
//           position: absolute;
//           bottom: 0;
//           left: 0;
//           width: 60px;
//           height: 4px;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           border-radius: 2px;
//         }
//         .section {
//           margin-bottom: 2.5rem;
//         }
//         .skills {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 0.8rem;
//           margin: 1.2rem 0;
//         }
//         .skill {
//           background: white;
//           padding: 0.6rem 1.2rem;
//           border-radius: 6px;
//           font-size: 0.9rem;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//           border: 1px solid #e2e8f0;
//           display: flex;
//           flex-direction: column;
//           transition: all 0.3s ease;
//         }
//         .skill:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 5px 15px rgba(0,0,0,0.1);
//           border-color: #667eea;
//         }
//         .card {
//           background: white;
//           border-radius: 8px;
//           padding: 1.8rem;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.05);
//           margin-bottom: 1.2rem;
//           transition: all 0.3s ease;
//           border: 1px solid #f1f5f9;
//         }
//         .card:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 12px 20px rgba(0,0,0,0.1);
//         }
//         .contact {
//           display: flex;
//           gap: 1.5rem;
//           flex-wrap: wrap;
//           margin: 1.2rem 0;
//         }
//         .contact a, .social-links a {
//           color: #667eea;
//           text-decoration: none;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           transition: all 0.3s ease;
//           font-weight: 500;
//         }
//         .contact a:hover, .social-links a:hover {
//           color: #5a67d8;
//           transform: translateY(-2px);
//         }
//         .social-links {
//           display: flex;
//           gap: 1.5rem;
//           margin-top: 1.2rem;
//         }
//         .nav {
//           display: flex;
//           gap: 2rem;
//           margin: 2.5rem 0;
//           padding: 1rem;
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//         }
//         .nav a {
//           color: #667eea;
//           text-decoration: none;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .nav a:hover {
//           color: #5a67d8;
//           text-decoration: underline;
//           transform: translateY(-2px);
//         }
//         .project-image {
//           max-width: 100%;
//           height: auto;
//           border-radius: 8px;
//           margin-bottom: 1rem;
//           transition: all 0.3s ease;
//         }
//         .project-image:hover {
//           transform: scale(1.02);
//           box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
//         }
//         @media (max-width: 768px) {
//           .header {
//             flex-direction: column;
//             text-align: center;
//             gap: 1.5rem;
//           }
//           .contact, .social-links {
//             justify-content: center;
//           }
//           .nav {
//             flex-wrap: wrap;
//             justify-content: center;
//           }
//         }
//       `,
//       creative: `
//         body {
//           font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
//           line-height: 1.6;
//           color: #2d3748;
//           background: #f0f9ff;
//           padding: 2rem;
//         }
//         .container {
//           max-width: 1000px;
//           margin: 0 auto;
//         }
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 3rem;
//           padding: 2rem;
//           background: white;
//           border-radius: 16px;
//           box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
//         }
//         .profile-img {
//           width: 180px;
//           height: 180px;
//           border-radius: 50%;
//           object-fit: cover;
//           border: 3px solid white;
//           box-shadow: 0 6px 12px rgba(0,0,0,0.15);
//           transition: all 0.3s ease;
//         }
//         .profile-img:hover {
//           transform: scale(1.05) rotate(2deg);
//           box-shadow: 0 12px 20px rgba(0,0,0,0.2);
//         }
//         h1 {
//           font-size: 3rem;
//           margin: 0;
//           color: #1e40af;
//           font-weight: 700;
//         }
//         h2 {
//           font-size: 2rem;
//           margin: 2.5rem 0 1.5rem;
//           color: #3730a3;
//           position: relative;
//           display: inline-block;
//           font-weight: 600;
//         }
//         h2:after {
//           content: '';
//           position: absolute;
//           bottom: -5px;
//           left: 0;
//           width: 100%;
//           height: 6px;
//           background: linear-gradient(90deg, #a855f7, #ec4899);
//           border-radius: 3px;
//         }
//         .section {
//           margin-bottom: 2.5rem;
//         }
//         .skills {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 0.8rem;
//           margin: 1.2rem 0;
//         }
//         .skill {
//           background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
//           color: white;
//           padding: 0.6rem 1.2rem;
//           border-radius: 9999px;
//           font-size: 0.9rem;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           display: flex;
//           flex-direction: column;
//           transition: all 0.3s ease;
//         }
//         .skill:hover {
//           transform: translateY(-3px) scale(1.05);
//           box-shadow: 0 8px 15px rgba(168, 85, 247, 0.4);
//         }
//         .card {
//           background: white;
//           border-radius: 12px;
//           padding: 1.8rem;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.05);
//           margin-bottom: 1.2rem;
//           border-left: 5px solid #a855f7;
//           transition: all 0.3s ease;
//         }
//         .card:hover {
//           transform: translateY(-5px) rotate(1deg);
//           box-shadow: 0 15px 30px rgba(0,0,0,0.1);
//           border-left: 5px solid #ec4899;
//         }
//         .contact {
//           display: flex;
//           gap: 1.5rem;
//           flex-wrap: wrap;
//           margin: 1.2rem 0;
//         }
//         .contact a, .social-links a {
//           color: #a855f7;
//           text-decoration: none;
//           font-weight: 500;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           transition: all 0.3s ease;
//         }
//         .contact a:hover, .social-links a:hover {
//           color: #ec4899;
//           transform: translateY(-2px) scale(1.05);
//         }
//         .social-links {
//           display: flex;
//           gap: 1.5rem;
//           margin-top: 1.2rem;
//         }
//         .nav {
//           display: flex;
//           gap: 2rem;
//           margin: 2.5rem 0;
//           padding: 1rem;
//           background: white;
//           border-radius: 12px;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.05);
//         }
//         .nav a {
//           color: #a855f7;
//           text-decoration: none;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .nav a:hover {
//           color: #ec4899;
//           text-decoration: underline;
//           transform: translateY(-2px);
//         }
//         .project-image {
//           max-width: 100%;
//           height: auto;
//           border-radius: 8px;
//           margin-bottom: 1rem;
//           transition: all 0.3s ease;
//         }
//         .project-image:hover {
//           transform: scale(1.02);
//           box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
//         }
//         @media (max-width: 768px) {
//           .header {
//             flex-direction: column;
//             text-align: center;
//             gap: 1.5rem;
//           }
//           .contact, .social-links {
//             justify-content: center;
//           }
//           .nav {
//             flex-wrap: wrap;
//             justify-content: center;
//           }
//           h1 {
//             font-size: 2.2rem;
//           }
//         }
//       `,
//       professional: `
//         body {
//           font-family: 'Inter', 'SF Pro Text', -apple-system, sans-serif;
//           line-height: 1.6;
//           color: #2d3748;
//           background: #f9fafb;
//           padding: 2rem;
//         }
//         .container {
//           max-width: 1000px;
//           margin: 0 auto;
//         }
//         .header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-bottom: 3rem;
//           padding-bottom: 2rem;
//           border-bottom: 1px solid #e5e7eb;
//         }
//         .profile-img {
//           width: 180px;
//           height: 180px;
//           border-radius: 50%;
//           object-fit: cover;
//           border: 3px solid #f3f4f6;
//           transition: all 0.3s ease;
//         }
//         .profile-img:hover {
//           transform: scale(1.03);
//           border-color: #3b82f6;
//           box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
//         }
//         h1 {
//           font-size: 2.5rem;
//           margin: 0;
//           color: #111827;
//           font-weight: 700;
//         }
//         h2 {
//           font-size: 1.5rem;
//           margin: 2.5rem 0 1.5rem;
//           color: #374151;
//           font-weight: 600;
//           padding-bottom: 0.5rem;
//           border-bottom: 2px solid #e5e7eb;
//         }
//         .section {
//           margin-bottom: 2.5rem;
//         }
//         .skills {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//           gap: 1rem;
//           margin: 1.2rem 0;
//         }
//         .skill {
//           background: white;
//           padding: 1rem;
//           border-radius: 6px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//           border-left: 3px solid #3b82f6;
//           display: flex;
//           flex-direction: column;
//           transition: all 0.3s ease;
//         }
//         .skill:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 5px 15px rgba(0,0,0,0.1);
//           border-left: 3px solid #2563eb;
//         }
//         .card {
//           background: white;
//           border-radius: 8px;
//           padding: 1.5rem;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//           margin-bottom: 1rem;
//           border-left: 3px solid #3b82f6;
//           transition: all 0.3s ease;
//         }
//         .card:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 5px 15px rgba(0,0,0,0.1);
//           border-left: 3px solid #2563eb;
//         }
//         .contact {
//           display: flex;
//           gap: 1.5rem;
//           flex-wrap: wrap;
//           margin: 1.2rem 0;
//         }
//         .contact a, .social-links a {
//           color: #3b82f6;
//           text-decoration: none;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .contact a:hover, .social-links a:hover {
//           color: #2563eb;
//           text-decoration: underline;
//           transform: translateY(-2px);
//         }
//         .social-links {
//           display: flex;
//           gap: 1.5rem;
//           margin-top: 1.2rem;
//         }
//         .nav {
//           display: flex;
//           gap: 2rem;
//           margin: 2.5rem 0;
//           padding: 1rem 0;
//           border-top: 1px solid #e5e7eb;
//           border-bottom: 1px solid #e5e7eb;
//         }
//         .nav a {
//           color: #4b5563;
//           text-decoration: none;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
//         .nav a:hover {
//           color: #3b82f6;
//           transform: translateY(-2px);
//         }
//         .project-image {
//           max-width: 100%;
//           height: auto;
//           border-radius: 8px;
//           margin-bottom: 1rem;
//           transition: all 0.3s ease;
//         }
//         .project-image:hover {
//           transform: scale(1.02);
//           box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
//         }
//         @media (max-width: 768px) {
//           .header {
//             flex-direction: column;
//             text-align: center;
//             gap: 1.5rem;
//           }
//           .contact, .social-links {
//             justify-content: center;
//           }
//           .nav {
//             flex-wrap: wrap;
//             justify-content: center;
//           }
//           .skills {
//             grid-template-columns: 1fr;
//           }
//         }
//       `
//     };

//     const style = themeStyles[theme] || themeStyles.clean;

//     return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>${escapeHtml(name)} - Portfolio</title>
//   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
//   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//   <style>${style}</style>
// </head>
// <body>
//   <div class="container">
//     <header class="header">
//       <div>
//         <h1>${escapeHtml(name || "Your Name")}</h1>
//         <p>${escapeHtml(title || "Your Professional Title")}</p>
//       </div>
//       ${profileImage ?
//         `<img src="${profileImage}" alt="${escapeHtml(name)}" class="profile-img">` :
//         `<div class="profile-img" style="background: #4f46e5; display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: bold;">
//           ${(name || "Y").slice(0, 2).toUpperCase()}
//         </div>`
//       }
//     </header>

//     <nav class="nav">
//       ${sections.summary ? `<a href="#about">About</a>` : ''}
//       ${sections.skills ? `<a href="#skills">Skills</a>` : ''}
//       ${sections.projects ? `<a href="#projects">Projects</a>` : ''}
//       ${sections.experience ? `<a href="#experience">Experience</a>` : ''}
//       ${sections.education ? `<a href="#education">Education</a>` : ''}
//       ${sections.contact ? `<a href="#contact">Contact</a>` : ''}
//     </nav>

//     ${sections.summary ? `
//     <section id="about" class="section">
//       <h2>About Me</h2>
//       <div class="card">
//         <p>${escapeHtml(summary || "A short summary about you and your professional background.")}</p>
//       </div>
//     </section>
//     ` : ''}

//     ${sections.skills ? `
//     <section id="skills" class="section">
//       <h2>Skills</h2>
//       <div class="skills">
//         ${skills.map(skill => `
//           <div class="skill">
//             <span>${escapeHtml(skill.name || skill)}</span>
//             ${skill.level ? `
//               <div class="skill-level">
//                 <div class="skill-level-inner" style="width: ${skill.level}%;"></div>
//               </div>
//             ` : ''}
//           </div>
//         `).join("")}
//       </div>
//     </section>
//     ` : ''}

//     ${sections.projects ? `
//     <section id="projects" class="section">
//       <h2>Projects</h2>
//       ${projects.map(project => `
//         <div class="card">
//           ${project.image ? `<img src="${project.image}" alt="${escapeHtml(project.name)}" class="project-image">` : ''}
//           <h3>${escapeHtml(project.name || project)}</h3>
//           <p>${escapeHtml(project.description || 'Project description')}</p>
//           ${project.link ? `<p><a href="${ensureHttp(project.link)}" target="_blank" rel="noopener noreferrer" class="project-link">View Project <i class="fas fa-external-link-alt"></i></a></p>` : ''}
//         </div>
//       `).join("")}
//     </section>
//     ` : ''}

//     ${sections.experience ? `
//     <section id="experience" class="section">
//       <h2>Experience</h2>
//       ${experience.map(exp => `
//         <div class="card">
//           <h3>${escapeHtml(exp.role || exp)}</h3>
//           <p><strong>${escapeHtml(exp.company || '')}</strong> ${exp.period ? `| ${escapeHtml(exp.period)}` : ''}</p>
//           <p>${escapeHtml(exp.description || 'Experience details')}</p>
//         </div>
//       `).join("")}
//     </section>
//     ` : ''}

//     ${sections.education ? `
//     <section id="education" class="section">
//       <h2>Education</h2>
//       ${education.map(edu => `
//         <div class="card">
//           <h3>${escapeHtml(edu.degree || edu)}</h3>
//           <p><strong>${escapeHtml(edu.institution || '')}</strong> ${edu.period ? `| ${escapeHtml(edu.period)}` : ''}</p>
//           <p>${escapeHtml(edu.description || 'Education details')}</p>
//         </div>
//       `).join("")}
//     </section>
//     ` : ''}

//     ${sections.contact ? `
//     <section id="contact" class="section">
//       <h2>Contact</h2>
//       <div class="contact">
//         ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}" target="_blank"><i class="fas fa-envelope"></i> ${escapeHtml(contact.email)}</a>` : ''}
//         ${contact.phone ? `<a href="tel:${escapeHtml(contact.phone)}" target="_blank"><i class="fas fa-phone"></i> ${escapeHtml(contact.phone)}</a>` : ''}
//         ${contact.website ? `<a href="${ensureHttp(contact.website)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-globe"></i> Website</a>` : ''}
//         ${contact.linkedin ? `<a href="${ensureHttp(contact.linkedin)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
//         ${contact.github ? `<a href="${ensureHttp(contact.github)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> GitHub</a>` : ''}
//       </div>

//       <div class="social-links">
//         ${socialLinks.twitter ? `<a href="${ensureHttp(socialLinks.twitter)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-twitter"></i> Twitter</a>` : ''}
//         ${socialLinks.dribbble ? `<a href="${ensureHttp(socialLinks.dribbble)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-dribbble"></i> Dribbble</a>` : ''}
//         ${socialLinks.behance ? `<a href="${ensureHttp(socialLinks.behance)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-behance"></i> Behance</a>` : ''}
//         ${socialLinks.instagram ? `<a href="${ensureHttp(socialLinks.instagram)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
//       </div>
//     </section>
//     ` : ''}
//   </div>
// </body>
// </html>`;
//   }


  function ensureHttp(url) {
    if (typeof url !== "string") return ""; // or return url safely
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return "https://" + url;
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

  function HostingModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-indigo-800">Host Your Portfolio</h2>
            <button onClick={() => setShowHostingModal(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Option 1: Netlify (Recommended)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <a href="https://netlify.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">netlify.com</a> and create an account</li>
                <li>Click on "Add new site" → "Deploy manually"</li>
                <li>Drag and drop your downloaded HTML file to the deployment area</li>
                <li>Your site will be live instantly with a custom URL</li>
                <li>You can customize the domain name in site settings</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Option 2: Vercel</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">vercel.com</a> and create an account</li>
                <li>Click on "Import Project"</li>
                <li>Drag and drop your HTML file</li>
                <li>Click deploy and your site will be live</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Option 3: GitHub Pages</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Create a new GitHub repository</li>
                <li>Upload your HTML file to the repository</li>
                <li>Go to repository Settings → Pages</li>
                <li>Select "main" branch as source and click Save</li>
                <li>Your site will be available at https://username.github.io/repository-name</li>
              </ol>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-indigo-800">Pro Tip</h3>
              <p>For better SEO and performance, consider using Netlify or Vercel as they offer custom domains, HTTPS, and CDN distribution automatically.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-indigo-800">Portfolio Builder</h1>
          <p className="text-lg text-indigo-600 mt-2">Create a beautiful portfolio from your resume in minutes</p>
        </header>

        <main className="grid md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-2 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg transition-all ${inputMode === 'paste' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setInputMode('paste')}
                >
                  Paste Resume
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-all ${inputMode === 'json' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setInputMode('json')}
                >
                  Upload JSON
                </button>
              </div>

              {inputMode === 'paste' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paste your resume</label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Paste your resume text here. For best results, include sections like:
- Name
- Title
- Summary
- Skills: React, JavaScript, CSS...
- Projects: Project Name — Description
- Experience: Job Title — Company — Period — Description
- Education: Degree — University — Year
- Contact: email@example.com, linkedin.com/in/name, github.com/username`}
                  ></textarea>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload structured JSON</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept="application/json" onChange={handleJSONUpload} className="hidden" />
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">Click to upload JSON file</p>
                      </div>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Expected format: {"{name, title, summary, skills: [], projects: [], experience: [], education: [], contact: {}}"}</div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setRawText(sampleResume); showToast("Sample resume loaded!"); }}
                  className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  Load Sample
                </button>
                <button
                  onClick={() => { setRawText(''); setParsed(null); }}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'personal' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  Personal
                </button>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'skills' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('skills')}
                >
                  Skills
                </button>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'projects' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('projects')}
                >
                  Projects
                </button>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'experience' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('experience')}
                >
                  Experience
                </button>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'social' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('social')}
                >
                  Social
                </button>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'sections' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('sections')}
                >
                  Sections
                </button>
              </div>

              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. Frontend Developer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-indigo-600 font-bold text-lg">{(name || "U").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Upload Image</span>
                      </label>
                      {profileImage && (
                        <button
                          onClick={() => setProfileImage(null)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="A brief summary about yourself and your professional background"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        value={contact.email}
                        onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        value={contact.phone}
                        onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      value={contact.website}
                      onChange={(e) => setContact(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Skills</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                    <input
                      id="skillInput"
                      className="md:col-span-3 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Skill name"
                    />
                    <select
                      id="skillLevel"
                      className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      defaultValue="80"
                    >
                      <option value="20">Beginner</option>
                      <option value="40">Intermediate</option>
                      <option value="60">Advanced</option>
                      <option value="80">Expert</option>
                      <option value="100">Master</option>
                    </select>
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center">
                        {skill.name || skill} {skill.level && `(${skill.level}%)`}
                        <button
                          onClick={() => removeSkill(index)}
                          className="ml-2 text-indigo-500 hover:text-indigo-700"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Projects</label>
                  <div className="space-y-3 mb-4">
                    <input
                      id="projectName"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Project Name"
                    />
                    <textarea
                      id="projectDescription"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Project Description"
                    />
                    <input
                      id="projectLink"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Project URL (optional)"
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Image</label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleProjectImageUpload} className="hidden" />
                            <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">Upload Image</span>
                          </label>
                          {currentProjectImage && (
                            <button
                              onClick={() => setCurrentProjectImage(null)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      {currentProjectImage && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                          <img src={currentProjectImage} alt="Project preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={addProject}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add Project
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{project.name || project.split('—')[0]}</div>
                          {project.description && <div className="text-sm text-gray-600 mt-1">{project.description}</div>}
                          {project.link && (
                            <a href={ensureHttp(project.link)} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 mt-1 block hover:underline">
                              {project.link}
                            </a>
                          )}
                          {project.image && (
                            <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                              <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeProject(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Experience</label>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          id="experienceRole"
                          className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Job Title"
                        />
                        <input
                          id="experienceCompany"
                          className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Company"
                        />
                      </div>
                      <input
                        id="experiencePeriod"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Period (e.g. Jan 2020 - Present)"
                      />
                      <textarea
                        id="experienceDescription"
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Description of your role and achievements"
                      />
                      <button
                        onClick={addExperience}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add Experience
                      </button>
                    </div>

                    <div className="space-y-3">
                      {experience.map((exp, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{exp.role || exp.split('—')[0]}</div>
                            <div className="text-sm text-gray-600">{exp.company || (exp.includes('—') ? exp.split('—')[1] : '')}</div>
                            {exp.period && <div className="text-sm text-gray-500">{exp.period}</div>}
                            {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                          </div>
                          <button
                            onClick={() => removeExperience(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Education</label>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          id="educationDegree"
                          className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Degree"
                        />
                        <input
                          id="educationInstitution"
                          className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Institution"
                        />
                      </div>
                      <input
                        id="educationPeriod"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Period (e.g. 2016 - 2020)"
                      />
                      <textarea
                        id="educationDescription"
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Description (optional)"
                      />
                      <button
                        onClick={addEducation}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add Education
                      </button>
                    </div>

                    <div className="space-y-3">
                      {education.map((edu, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{edu.degree || edu.split('—')[0]}</div>
                            <div className="text-sm text-gray-600">{edu.institution || (edu.includes('—') ? edu.split('—')[1] : '')}</div>
                            {edu.period && <div className="text-sm text-gray-500">{edu.period}</div>}
                            {edu.description && <div className="text-sm text-gray-600 mt-1">{edu.description}</div>}
                          </div>
                          <button
                            onClick={() => removeEducation(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input
                      value={contact.linkedin}
                      onChange={(e) => setContact(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                    <input
                      value={contact.github}
                      onChange={(e) => setContact(prev => ({ ...prev, github: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://twitter.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dribbble</label>
                    <input
                      value={socialLinks.dribbble}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, dribbble: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://dribbble.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Behance</label>
                    <input
                      value={socialLinks.behance}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, behance: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://behance.net/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'sections' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800">Select which sections to include in your portfolio:</h3>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">About Me Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.summary}
                        onChange={() => setSections(prev => ({ ...prev, summary: !prev.summary }))}
                        className="opacity-0 w-0 h-0"
                        id="summary-toggle"
                      />
                      <label
                        htmlFor="summary-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.summary ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.summary ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">Skills Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.skills}
                        onChange={() => setSections(prev => ({ ...prev, skills: !prev.skills }))}
                        className="opacity-0 w-0 h-0"
                        id="skills-toggle"
                      />
                      <label
                        htmlFor="skills-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.skills ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.skills ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">Projects Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.projects}
                        onChange={() => setSections(prev => ({ ...prev, projects: !prev.projects }))}
                        className="opacity-0 w-0 h-0"
                        id="projects-toggle"
                      />
                      <label
                        htmlFor="projects-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.projects ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.projects ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">Experience Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.experience}
                        onChange={() => setSections(prev => ({ ...prev, experience: !prev.experience }))}
                        className="opacity-0 w-0 h-0"
                        id="experience-toggle"
                      />
                      <label
                        htmlFor="experience-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.experience ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.experience ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">Education Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.education}
                        onChange={() => setSections(prev => ({ ...prev, education: !prev.education }))}
                        className="opacity-0 w-0 h-0"
                        id="education-toggle"
                      />
                      <label
                        htmlFor="education-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.education ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.education ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-gray-700">Contact Section</label>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={sections.contact}
                        onChange={() => setSections(prev => ({ ...prev, contact: !prev.contact }))}
                        className="opacity-0 w-0 h-0"
                        id="contact-toggle"
                      />
                      <label
                        htmlFor="contact-toggle"
                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${sections.contact ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute h-4 w-4 bg-white rounded-full transition-transform duration-300 ${sections.contact ? 'translate-x-6' : 'translate-x-1'} top-1`}></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Theme & Export</h2>
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="clean">Clean</option>
                    <option value="modern">Modern</option>
                    <option value="creative">Creative</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <button
                  onClick={downloadHTML}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download HTML
                </button>

                <button
                  onClick={exportJSON}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  Export JSON
                </button>

                <button
                  onClick={() => setShowHostingModal(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                  </svg>
                  Host Online
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>After downloading, you can:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Open the HTML file in any browser to view your portfolio</li>
                  <li>Host it on GitHub Pages, Netlify, or Vercel for free</li>
                  <li>Share the link on LinkedIn and other professional networks</li>
                  <li>Import the JSON file later to continue editing</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <div className="sticky top-6">
              <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Live Preview</h2>
                <p className="text-sm text-gray-600">This is how your portfolio will look. Edit fields on the left to see changes.</p>
              </div>

              <div className={`rounded-xl shadow-lg overflow-hidden ${theme === 'clean' ? 'bg-white' :
                theme === 'modern' ? 'bg-gradient-to-r from-gray-50 to-blue-50' :
                  theme === 'creative' ? 'bg-gradient-to-r from-purple-50 to-pink-50' :
                    'bg-gradient-to-r from-gray-50 to-gray-100'
                }`}>
                <RenderPreview
                  theme={theme}
                  name={name}
                  title={title}
                  summary={summary}
                  skills={skills}
                  projects={projects}
                  experience={experience}
                  education={education}
                  contact={contact}
                  socialLinks={socialLinks}
                  profileImage={profileImage}
                  sections={sections}
                />
              </div>
            </div>
          </section>
        </main>

        <footer className="text-center py-8 text-gray-600 text-sm">
          <p>Made with ❤️ — Create a professional portfolio in minutes</p>
        </footer>
      </div>

      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
          {toast.message}
        </div>
      )}

      {showHostingModal && <HostingModal />}
    </div>
  );
}

function RenderPreview({ theme, name, title, summary, skills, projects, experience, education, contact, socialLinks, profileImage, sections }) {
  const themeClasses = {
    clean: {
      card: 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      skill: 'bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm transition-all duration-300 hover:bg-indigo-200 hover:scale-105',
      link: 'text-indigo-600 hover:text-indigo-800 transition-colors duration-300'
    },
    modern: {
      card: 'bg-white p-4 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
      skill: 'bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:bg-blue-200 hover:scale-105',
      link: 'text-blue-600 hover:text-blue-800 transition-colors duration-300'
    },
    creative: {
      card: 'bg-white p-4 rounded-xl shadow-md border-l-4 border-purple-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-600',
      skill: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-pink-600',
      link: 'text-purple-600 hover:text-pink-600 transition-colors duration-300'
    },
    professional: {
      card: 'bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-600',
      skill: 'bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm transition-all duration-300 hover:bg-blue-200',
      link: 'text-blue-600 hover:text-blue-800 transition-colors duration-300'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.clean;

  return (
    <div className="p-6">
      <div className="flex items-start gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{name || "Your Name"}</h1>
          <p className="text-lg text-gray-600 mt-1">{title || "Your Professional Title"}</p>
        </div>
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            (name || "Y").slice(0, 2).toUpperCase()
          )}
        </div>
      </div>

      {sections.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">About Me</h2>
          <div className={currentTheme.card}>
            <p className="text-gray-700">{summary || "A short summary about you and your professional background."}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {sections.skills && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, i) => (
                  <span key={i} className={currentTheme.skill}>
                    {skill.name || skill} {skill.level && `(${skill.level}%)`}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">Add your skills</p>
              )}
            </div>
          </div>
        )}

        {sections.contact && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">Contact</h2>
            <div className="space-y-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                  <span className="mr-2">📧</span> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                  <span className="mr-2">📱</span> {contact.phone}
                </a>
              )}
              {contact.website && (
                <a href={ensureHttp(contact.website)} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                  <span className="mr-2">🌐</span> {contact.website}
                </a>
              )}
              {contact.linkedin && (
                <a href={ensureHttp(contact.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                  <span className="mr-2">💼</span> {contact.linkedin}
                </a>
              )}
              {contact.github && (
                <a href={ensureHttp(contact.github)} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                  <span className="mr-2">🐙</span> {contact.github}
                </a>
              )}
              {!contact.email && !contact.phone && !contact.website && !contact.linkedin && !contact.github && (
                <p className="text-gray-500">Add your contact information</p>
              )}
            </div>

            {(socialLinks.twitter || socialLinks.dribbble || socialLinks.behance || socialLinks.instagram) && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-800 mb-2">Social Links</h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.twitter && (
                    <a href={ensureHttp(socialLinks.twitter)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Twitter</a>
                  )}
                  {socialLinks.dribbble && (
                    <a href={ensureHttp(socialLinks.dribbble)} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">Dribbble</a>
                  )}
                  {socialLinks.behance && (
                    <a href={ensureHttp(socialLinks.behance)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Behance</a>
                  )}
                  {socialLinks.instagram && (
                    <a href={ensureHttp(socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Instagram</a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {sections.projects && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">Projects</h2>
          <div className="space-y-4">
            {/* {projects.length > 0 ? (
              projects.map((project, i) => (
                <div key={i} className={currentTheme.card}>
                  {project.image && (
                    <img src={project.image} alt={project.name} className="w-full h-48 object-cover rounded-lg mb-3" />
                  )}
                  <h3 className="font-medium text-gray-900">{project.name || project.split('—')[0] || project}</h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                  )}
                  {project.link && (
                    <a href={ensureHttp(project.link)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm mt-1 block hover:underline">
                      {project.link}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">Add your projects</p>
            )} */}
            {projects.length > 0 ? (
              projects.map((project, i) => {
                // normalize: if project is a string, convert to object (optional)
                const projObj = typeof project === "string"
                  ? { name: project, description: "", link: "" }
                  : project || {};

                const rawLink = projObj.link;
                const href = ensureHttp(rawLink);

                return (
                  <div key={i} className={currentTheme.card}>
                    {projObj.image && (
                      <img src={projObj.image} alt={projObj.name || `project-${i}`} className="w-full h-48 object-cover rounded-lg mb-3" />
                    )}
                    <h3 className="font-medium text-gray-900">{projObj.name || (typeof project === 'string' ? project.split('—')[0] : "Untitled")}</h3>

                    {projObj.description && <p className="text-gray-600 text-sm mt-1">{projObj.description}</p>}

                    {/* Only render anchor if we got a real URL (not '#') */}
                    {href !== "#" && rawLink && (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm mt-1 block hover:underline">
                        {rawLink}
                      </a>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">Add your projects</p>
            )}

          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.experience && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">Experience</h2>
            <div className="space-y-4">
              {experience.length > 0 ? (
                experience.map((exp, i) => (
                  <div key={i} className={currentTheme.card}>
                    <h3 className="font-medium text-gray-900">{exp.role || exp.split('—')[0] || exp}</h3>
                    <div className="text-sm text-gray-600">{exp.company || (exp.includes('—') ? exp.split('—')[1] : '')}</div>
                    {exp.period && <div className="text-sm text-gray-500">{exp.period}</div>}
                    {exp.description && <div className="text-sm text-gray-600 mt-1">{exp.description}</div>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Add your experience</p>
              )}
            </div>
          </div>
        )}

        {sections.education && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">Education</h2>
            <div className="space-y-4">
              {education.length > 0 ? (
                education.map((edu, i) => (
                  <div key={i} className={currentTheme.card}>
                    <h3 className="font-medium text-gray-900">{edu.degree || edu.split('—')[0] || edu}</h3>
                    <div className="text-sm text-gray-600">{edu.institution || (edu.includes('—') ? edu.split('—')[1] : '')}</div>
                    {edu.period && <div className="text-sm text-gray-500">{edu.period}</div>}
                    {edu.description && <div className="text-sm text-gray-600 mt-1">{edu.description}</div>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Add your education</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sampleResume = `Anurag Singh
Software Engineer (Mobile Developer)
`;

// function ensureHttp(url) {
//   if (!url) return '#';
//   if (!url.startsWith('http://') && !url.startsWith('https://')) {
//     return 'https://' + url;
//   }
//   return url;
// }
function ensureHttp(raw) {
  // handle null/undefined/empty
  if (raw === null || raw === undefined) return "#";

  // if it's already a string — normalize and validate
  if (typeof raw === "string") {
    const url = raw.trim();
    if (url === "") return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return "https://" + url;
  }

  // if the value is an object that might have a link-like prop
  if (typeof raw === "object") {
    // common patterns
    if (raw.href && typeof raw.href === "string") return ensureHttp(raw.href);
    if (raw.url && typeof raw.url === "string") return ensureHttp(raw.url);

    // fallback to string coercion (use cautiously)
    try {
      const s = String(raw).trim();
      if (s) return ensureHttp(s);
    } catch (e) {
      // ignore
    }
  }

  // final safe fallback
  return "#";
}


