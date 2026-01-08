"""
Skill Extractor - Identifies and categorizes skills from text
"""

import json
import os
from typing import List, Dict
from pathlib import Path


class SkillExtractor:
    """Extract and categorize skills from resume text"""

    def __init__(self):
        # Comprehensive skill database
        self.skill_database = {
            "programming": [
                "python", "java", "javascript", "typescript", "c++", "c#", "ruby",
                "php", "swift", "kotlin", "go", "rust", "scala", "r", "matlab"
            ],
            "web_frameworks": [
                "react", "angular", "vue", "svelte", "django", "flask", "fastapi",
                "express", "next.js", "nuxt", "spring", "asp.net", "laravel"
            ],
            "databases": [
                "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra",
                "oracle", "dynamodb", "elasticsearch", "neo4j", "sqlite"
            ],
            "cloud": [
                "aws", "azure", "gcp", "google cloud", "heroku", "digitalocean",
                "firebase", "cloudflare", "vercel", "netlify"
            ],
            "devops": [
                "docker", "kubernetes", "jenkins", "gitlab ci", "github actions",
                "terraform", "ansible", "chef", "puppet", "ci/cd", "devops"
            ],
            "machine_learning": [
                "machine learning", "deep learning", "neural networks", "nlp",
                "computer vision", "tensorflow", "pytorch", "scikit-learn",
                "keras", "opencv", "pandas", "numpy", "ml", "ai"
            ],
            "data_science": [
                "data analysis", "data science", "statistics", "data visualization",
                "tableau", "power bi", "matplotlib", "seaborn", "plotly", "jupyter"
            ],
            "mobile": [
                "android", "ios", "react native", "flutter", "swift", "kotlin",
                "xamarin", "ionic", "cordova"
            ],
            "soft_skills": [
                "leadership", "communication", "teamwork", "problem solving",
                "critical thinking", "agile", "scrum", "project management"
            ]
        }

        # Flatten all skills for quick lookup
        self.all_skills = []
        for category, skills in self.skill_database.items():
            self.all_skills.extend(skills)

    def extract(self, text: str) -> Dict[str, List[str]]:
        """
        Extract skills from text

        Args:
            text: Resume text

        Returns:
            Dictionary with categorized skills
        """
        text_lower = text.lower()
        found_skills = {category: [] for category in self.skill_database.keys()}
        all_found = []

        # Search for each skill
        for category, skills in self.skill_database.items():
            for skill in skills:
                if skill.lower() in text_lower:
                    found_skills[category].append(skill.title())
                    all_found.append(skill.title())

        # Remove duplicates and return
        for category in found_skills:
            found_skills[category] = list(set(found_skills[category]))

        return {
            "by_category": found_skills,
            "all_skills": list(set(all_found)),
            "skill_count": len(set(all_found))
        }

    def get_top_skills(self, skills_data: Dict, top_n: int = 10) -> List[str]:
        """Get top N skills"""
        return skills_data.get("all_skills", [])[:top_n]

