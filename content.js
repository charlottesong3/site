/* =========================================================================
   content.js — everything you'll want to edit lives here.
   Anything in [brackets] is a placeholder and shows up dashed on the page.
   ========================================================================= */

window.SITE = {
  name: "charlotte song",
  tagline: "computer science + business @ usc",

  links: {
    email: "charlottesong1213@gmail.com",
    linkedin: "https://www.linkedin.com/in/charlotte-song",
    github: "https://github.com/[your-handle]",
    resume: "resume.pdf",
  },

  about: [
    "hi! i'm charlotte, a junior at usc viterbi studying computer science and business administration.",
    "i like the space where products meet people: figuring out what's worth building, why it matters, and how to get it out the door.",
    "outside of class i lead marketing for athenahacks, teach english and computer skills at the los angeles public library, and build things like tunein, a music practice coach for smart glasses.",
  ],

  /* Each folder on the desktop. `items` burst out of the folder when it opens;
     clicking an item opens its file window. */
  folders: [
    {
      id: "work",
      label: "work experience",
      items: [
        {
          id: "capital-group",
          name: "capital group",
          logo: "assets/logos/capital-group.png",
          role: "business transformation summer associate",
          when: "jun – aug 2026",
          where: "los angeles, ca",
          summary: "Equity Portfolio Strategy Management: finding and fixing the operational friction in how portfolio teams across global offices hand off work.",
          bullets: [
            "Developed a Power Automate solution that centralized information from Microsoft Teams channels, emails, and Microsoft Lists, eliminating manual data collection and saving 3 hours per office daily",
            "Partnered with the portfolio team to map the global office handover process in Visio, uncovering redundant tasks that consumed 13% of each associate's time",
            "Redesigned the handover process and reporting structure for portfolio teams across 5 global offices, improving consistency and continuity across time zones",
          ],
          tags: ["power automate", "visio", "process design", "operations"],
        },
        {
          id: "verv",
          name: "verv energy",
          logo: "assets/logos/verv.png",
          tile: "blue",                    // white logo → blue tile in its window
          role: "intern",
          when: "may – aug 2025",
          where: "los angeles, ca",
          summary: "Verv builds AI-driven climate solutions. I worked across fundraising, data, and client reporting.",
          bullets: [
            "Researched potential investors, wrote proposals, and prepared pitch decks, resulting in 3 new six-figure partnerships",
            "Analyzed 1,000+ AWS data files and built performance models that uncovered latent issues across multiple locations, all successfully remediated",
            "Designed client-facing reports and interactive data visualizations (Python, HTML) showing the efficacy of Verv devices",
          ],
          tags: ["python", "aws", "data viz", "fundraising"],
        },
        {
          id: "waymo",
          name: "waymo",
          logo: "assets/logos/waymo.png",
          role: "scholar fellow",
          when: "nov – dec 2023",
          where: "los angeles, ca",
          summary: "A hands-on fellowship inside Waymo's LA operations, from the data to the driving.",
          bullets: [
            "Analyzed cross-departmental data and presented strategic recommendations for energy optimization",
            "Diagnosed system and performance issues during 300+ miles of autonomous vehicle testing in Los Angeles",
            "Shadowed daily operations across Product Management, Engineering, Marketing, and Policy",
          ],
          tags: ["autonomous vehicles", "data analysis", "operations"],
        },
        {
          id: "lapl",
          name: "la public library",
          logo: "assets/logos/lapl.png",
          logoStyle: "round",
          role: "teacher, adult literacy services",
          when: "mar 2026 – present",
          where: "los angeles, ca",
          summary: "Teaching English literacy and computer skills to adult learners.",
          bullets: [
            "Lead 2 weekly 90-minute classes on English literacy and computer skills, teaching ~50 students a month",
            "Create and adapt curricula to students' evolving needs and widely varying skill levels",
          ],
          tags: ["teaching", "curriculum design", "community"],
        },
      ],
    },
    {
      id: "projects",
      label: "projects & leadership",
      items: [
        {
          id: "tunein",
          name: "tunein",
          icon: "note",
          role: "music practice coach for smart glasses",
          when: "lahacks 2026",
          where: "even realities g2 + creao",
          summary: "A practice coach that lives on the lens of Even Realities G2 glasses: a live tuner, sheet music one line at a time, and points for hitting pitch and beat.",
          bullets: [
            "Built a \"Practice Coach\" agent in CREAO that generates exercises and levels you up",
            "Pitch tuner running on the glasses: mic in, feedback on the display (no camera, no speaker)",
          ],
          tags: ["hackathon", "agents", "wearables"],
          link: { label: "watch the demo", href: "https://www.youtube.com/watch?v=B2Cj8w98JmY" },
        },
        {
          id: "athenahacks",
          name: "athenahacks",
          icon: "star",
          role: "organizer & marketing team lead",
          when: "aug 2024 – present",
          where: "los angeles, ca",
          summary: "Helping run AthenaHacks at USC, from the marketing that fills the room to the budget that runs it.",
          bullets: [
            "Lead a marketing team of 8, growing hackathon applicants from 80 to 300 (3.75x) through social campaigns designed in Figma and Canva",
            "Manage internal productions: sponsorships, workshops, merchandising, and a $35k budget",
          ],
          tags: ["leadership", "marketing", "events"],
          link: { label: "athenahacks.com", href: "https://athenahacks.com/" },
        },
        {
          id: "peking",
          name: "peking university",
          icon: "globe",
          role: "research program, school of advanced computing",
          when: "jun – jul 2025",
          where: "beijing, china",
          summary: "A summer research program on AI development and operations.",
          bullets: [
            "Explored operations optimizations at Microsoft and Li Motors during facility tours",
            "Delivered a final research presentation on AI development to faculty and peers",
          ],
          tags: ["research", "ai", "operations"],
        },
        {
          id: "website",
          name: "this website",
          icon: "cloud",
          role: "designed + built from scratch",
          when: "nov 2026",
          where: "html · css · canvas",
          summary: "The hero is a live dot-matrix of a dithered photo: move your cursor and the clouds scatter. Each bunny is 111 dots.",
          bullets: [
            "No frameworks: canvas rendering, spring physics, and a folder UI",
            "Deployed on Vercel",
          ],
          tags: ["design", "frontend"],
        },
      ],
    },
  ],
};
