import os
import json
import asyncio
from typing import Dict, List, Optional
import google.generativeai as genai
from app.utils.logger import logger

class GeminiService:
    """Service for integrating with Google Gemini 2.0 Flash for NLP and business intelligence"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_AI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.business_context_prompt = self._load_business_context_prompt()
    
    def _load_business_context_prompt(self) -> str:
        """Load business context prompt for SME business intelligence"""
        return """
        You are an AI assistant specialized in Small and Medium Enterprise (SME) business intelligence.
        Your role is to help business users understand their data through natural language queries.
        
        Key capabilities:
        1. Convert natural language queries to SQL queries
        2. Suggest appropriate visualizations for data
        3. Provide business insights and recommendations
        4. Focus on SME-specific metrics and KPIs
        
        Context: You're working with business data including sales, customers, inventory, finance, and operations.
        Always provide practical, actionable insights relevant to SME business owners and managers.
        
        When processing queries:
        - Interpret the business intent behind the question
        - Generate appropriate SQL if data retrieval is needed
        - Suggest visualization types (charts, graphs, tables)
        - Provide business context and insights
        - Include confidence scores for your interpretations
        """
    
    async def health_check(self) -> str:
        """Check if Gemini service is accessible"""
        try:
            # Simple test generation
            response = await self._generate_content("Test connection")
            return "healthy" if response else "unhealthy"
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return "unhealthy"
    
    async def _generate_content(self, prompt: str) -> Optional[str]:
        """Generate content using Gemini model"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            return response.text
        except Exception as e:
            logger.error(f"Content generation failed: {str(e)}")
            return None
    
    async def process_business_query(
        self, 
        query: str, 
        context: Dict = None, 
        organization_id: str = None
    ) -> Dict:
        """Process natural language business query and return structured response"""
        try:
            # Build enhanced prompt with business context
            enhanced_prompt = f"""
            {self.business_context_prompt}
            
            Organization Context: {json.dumps(context) if context else 'No specific context provided'}
            
            User Query: "{query}"
            
            Please provide a structured response in JSON format with the following fields:
            {{
                "interpretation": "What the user is asking for in business terms",
                "sql_query": "SQL query to retrieve the data (if applicable)",
                "visualization_config": {{
                    "type": "chart type (bar, line, pie, table, etc.)",
                    "x_axis": "x-axis field",
                    "y_axis": "y-axis field",
                    "title": "suggested chart title"
                }},
                "insights": ["List of business insights and recommendations"],
                "confidence": 0.95,
                "query_type": "Type of query (analytical, operational, strategic, etc.)"
            }}
            
            Focus on SME business metrics like revenue, profit margins, customer acquisition, 
            inventory turnover, cash flow, and operational efficiency.
            """
            
            response_text = await self._generate_content(enhanced_prompt)
            
            if not response_text:
                return {
                    "interpretation": "Failed to process query",
                    "confidence": 0.0,
                    "error": "Gemini service unavailable"
                }
            
            # Try to parse JSON response
            try:
                # Clean up response text (remove markdown formatting if present)
                clean_response = response_text.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response[7:]
                if clean_response.endswith('```'):
                    clean_response = clean_response[:-3]
                
                parsed_response = json.loads(clean_response.strip())
                
                # Validate required fields
                required_fields = ['interpretation', 'confidence']
                for field in required_fields:
                    if field not in parsed_response:
                        parsed_response[field] = "Not provided" if field == 'interpretation' else 0.5
                
                # Add metadata
                parsed_response['original_query'] = query
                parsed_response['organization_id'] = organization_id
                parsed_response['processed_at'] = asyncio.get_event_loop().time()
                
                logger.info(f"Successfully processed business query for org {organization_id}")
                return parsed_response
                
            except json.JSONDecodeError:
                # Fallback: create structured response from text
                return {
                    "interpretation": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                    "insights": [response_text[-200:]] if len(response_text) > 200 else [response_text],
                    "confidence": 0.7,
                    "query_type": "general",
                    "original_query": query,
                    "organization_id": organization_id,
                    "note": "Response was not in JSON format, providing text fallback"
                }
                
        except Exception as e:
            logger.error(f"Business query processing failed: {str(e)}")
            return {
                "interpretation": f"Error processing query: {str(e)}",
                "confidence": 0.0,
                "error": str(e)
            }
    
    async def generate_business_insights(
        self, 
        data_summary: Dict, 
        organization_id: str = None
    ) -> Dict:
        """Generate business insights from data summary"""
        try:
            prompt = f"""
            {self.business_context_prompt}
            
            Data Summary: {json.dumps(data_summary)}
            
            Based on this SME business data, provide insights in JSON format:
            {{
                "key_insights": ["List of key business insights"],
                "recommendations": ["Actionable recommendations"],
                "trends": ["Identified trends"],
                "alerts": ["Important alerts or concerns"],
                "opportunities": ["Growth opportunities"],
                "confidence": 0.95
            }}
            
            Focus on practical insights that SME owners can act upon.
            """
            
            response_text = await self._generate_content(prompt)
            
            if response_text:
                try:
                    clean_response = response_text.strip()
                    if clean_response.startswith('```json'):
                        clean_response = clean_response[7:]
                    if clean_response.endswith('```'):
                        clean_response = clean_response[:-3]
                    
                    return json.loads(clean_response.strip())
                except json.JSONDecodeError:
                    return {
                        "key_insights": [response_text],
                        "confidence": 0.7,
                        "note": "Fallback text response"
                    }
            
            return {"error": "Failed to generate insights"}
            
        except Exception as e:
            logger.error(f"Insight generation failed: {str(e)}")
            return {"error": str(e)}
    
    async def optimize_query_performance(self, sql_query: str) -> Dict:
        """Optimize SQL query for better performance"""
        try:
            prompt = f"""
            You are a database performance expert. Analyze this SQL query and provide optimization suggestions:
            
            SQL Query: {sql_query}
            
            Provide response in JSON format:
            {{
                "optimized_query": "Optimized version of the SQL query",
                "suggestions": ["List of optimization suggestions"],
                "performance_impact": "Expected performance improvement",
                "confidence": 0.95
            }}
            """
            
            response_text = await self._generate_content(prompt)
            
            if response_text:
                try:
                    clean_response = response_text.strip()
                    if clean_response.startswith('```json'):
                        clean_response = clean_response[7:]
                    if clean_response.endswith('```'):
                        clean_response = clean_response[:-3]
                    
                    return json.loads(clean_response.strip())
                except json.JSONDecodeError:
                    return {
                        "optimized_query": sql_query,
                        "suggestions": [response_text],
                        "confidence": 0.5
                    }
            
            return {"error": "Failed to optimize query"}
            
        except Exception as e:
            logger.error(f"Query optimization failed: {str(e)}")
            return {"error": str(e)}
