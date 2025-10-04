export async function summarizeJob(text: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800));

  return `Mock Summary: Extracted main job requirements here.

Key Requirements:
• 3+ years of experience in software development
• Strong knowledge of React, TypeScript, and Node.js
• Experience with cloud platforms (AWS, Azure, or GCP)
• Excellent communication and teamwork skills
• Bachelor's degree in Computer Science or related field

Responsibilities:
• Design and develop scalable web applications
• Collaborate with cross-functional teams
• Participate in code reviews and technical discussions
• Mentor junior developers`;
}

export async function tailorResume(resume: string, job: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1200));

  return `Mock Resume: Rewritten resume tailored for the job posting.

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience building scalable web applications using React, TypeScript, and Node.js. Proven track record of delivering high-quality solutions in cloud environments and leading technical initiatives.

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, RESTful APIs
• Cloud: AWS (EC2, S3, Lambda), Azure, Docker
• Tools: Git, CI/CD, Agile/Scrum

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
• Architected and developed 10+ enterprise web applications using React and TypeScript
• Reduced page load time by 40% through performance optimization
• Mentored team of 5 junior developers and conducted code reviews
• Collaborated with product managers and designers to deliver user-centric solutions

[Resume continues with tailored content matching job requirements...]`;
}

export async function generateCoverLetter(resume: string, job: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return `Mock Cover Letter: Drafted professional cover letter here.

Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience building scalable web applications using React, TypeScript, and Node.js, I am confident that my skills and background make me an excellent fit for this role.

In my current role as Senior Software Engineer, I have successfully delivered numerous enterprise applications, consistently meeting deadlines while maintaining high code quality standards. My experience with cloud platforms, particularly AWS, aligns perfectly with your requirements, and I have a proven track record of optimizing application performance and scalability.

What excites me most about this opportunity is the chance to work on challenging projects that make a real impact. I am particularly drawn to your company's commitment to innovation and collaborative culture. I am confident that my technical expertise, combined with my passion for mentoring and knowledge sharing, would make me a valuable addition to your team.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. Thank you for considering my application.

Best regards,
[Your Name]`;
}
