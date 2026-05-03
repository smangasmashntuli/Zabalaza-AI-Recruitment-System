import re

file_path = r"backend\app\services\gemini_service.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the indentation by replacing 6 spaces with 4 spaces at the method definition level
content = content.replace('\n      def analyze_match_details', '\n    def analyze_match_details')
content = content.replace('\n      def get_resume_tailoring_suggestions', '\n    def get_resume_tailoring_suggestions')
content = content.replace('\n      def get_profile_improvement_tips', '\n    def get_profile_improvement_tips')
content = content.replace('\n      def chat', '\n    def chat')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed gemini_service.py indentation")

