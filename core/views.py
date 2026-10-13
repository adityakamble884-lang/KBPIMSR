import json
import urllib.request
import urllib.error
import os
import csv
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action

from core.models import User, StudentEnquiry, InteractionLog, SystemConfiguration, CourseAllocationMapping, ChatbotFAQ, AuditLog
from core.serializers import (
    UserSerializer, StudentEnquirySerializer, InteractionLogSerializer, 
    SystemConfigurationSerializer, CourseAllocationMappingSerializer, 
    ChatbotFAQSerializer, AuditLogSerializer
)
from core.routing_logic import allocate_lead

# Helper to log audit events
def log_audit_event(user, action_desc, request):
    # Retrieve IP Address
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    AuditLog.objects.create(user=user if user and user.is_authenticated else None, action=action_desc, ip_address=ip)


# --- CUSTOM PERMISSIONS ---
class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'super_admin'

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'super_admin']

class IsFacultyOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['faculty', 'admin', 'super_admin']


# --- AUTHENTICATION ---
class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
            
        if user.status == 'suspended' or not user.is_active:
            log_audit_event(user, f"Failed login attempt - Account is suspended/inactive", request)
            return Response({'error': 'This account has been suspended or deactivated'}, status=status.HTTP_403_FORBIDDEN)
            
        token, _ = Token.objects.get_or_create(user=user)
        log_audit_event(user, "User logged in successfully", request)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


# --- STUDENT ENQUIRY CAPTURE (PUBLIC) ---
class EnquirySubmitView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentEnquirySerializer(data=request.data)
        if serializer.is_valid():
            # Save enquiry
            enquiry = serializer.save()
            
            # Log event in AuditLog (anonymous/system action)
            log_audit_event(None, f"New Student Enquiry registered: {enquiry.name} for {enquiry.course_of_interest}", request)
            
            # Allocate Lead
            officer = allocate_lead(enquiry)
            
            # Create default first interaction log
            officer_name = officer.username if officer else "System"
            InteractionLog.objects.create(
                student=enquiry,
                officer=officer,
                note=f"Lead automatically captured and allocated to {officer_name}.",
                status_changed_to='new_lead'
            )
            
            # Reload enquiry to get assigned officer data
            enquiry.refresh_from_db()
            response_serializer = StudentEnquirySerializer(enquiry)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- FACULTY / LEAD MANAGEMENT ---
class FacultyLeadsViewSet(viewsets.ModelViewSet):
    serializer_class = StudentEnquirySerializer
    permission_classes = [IsFacultyOrAbove]

    def get_queryset(self):
        user = self.request.user
        queryset = StudentEnquiry.objects.all().order_by('-created_at')
        
        # If user is faculty, only show their leads
        if user.role == 'faculty':
            queryset = queryset.filter(assigned_officer=user)
            
        # Apply filters
        course = self.request.query_params.get('course')
        lead_status = self.request.query_params.get('status')
        city = self.request.query_params.get('city')
        search = self.request.query_params.get('search')
        
        if course:
            queryset = queryset.filter(course_of_interest=course)
        if lead_status:
            queryset = queryset.filter(status=lead_status)
        if city:
            queryset = queryset.filter(city_village_area__icontains=city)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(mobile_number__icontains=search) | 
                Q(previous_college__icontains=search)
            )
            
        return queryset

    # Custom action to update a lead's status and add a log entry in one request
    @action(detail=True, methods=['post'])
    def log_interaction(self, request, pk=None):
        lead = self.get_object()
        note = request.data.get('note')
        new_status = request.data.get('status')
        
        if not note:
            return Response({'error': 'Note is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Log event
        log = InteractionLog.objects.create(
            student=lead,
            officer=request.user,
            note=note,
            status_changed_to=new_status
        )
        
        if new_status and new_status != lead.status:
            lead.status = new_status
            lead.save()
            log_audit_event(request.user, f"Updated lead {lead.name} status to {new_status}", request)
            
        return Response({
            'message': 'Interaction logged successfully',
            'lead': StudentEnquirySerializer(lead).data,
            'log': InteractionLogSerializer(log).data
        })


# --- ADMIN ANALYTICS ---
class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        # 1. High-level KPIs
        total_leads = StudentEnquiry.objects.count()
        walk_ins = StudentEnquiry.objects.filter(status='campus_visited').count()
        conversions = StudentEnquiry.objects.filter(status='admission_done').count()
        dropped = StudentEnquiry.objects.filter(status='dropped').count()
        in_progress = StudentEnquiry.objects.filter(status__in=['new_lead', 'contacted', 'in_progress']).count()
        
        conversion_rate = round((conversions / total_leads * 100), 2) if total_leads > 0 else 0.0
        
        kpis = {
            'total_leads': total_leads,
            'walk_ins': walk_ins,
            'conversions': conversions,
            'dropped': dropped,
            'in_progress': in_progress,
            'conversion_rate': conversion_rate
        }
        
        # 2. Demographics (Leads by City/Village/Area)
        demographics = list(StudentEnquiry.objects.values('city_village_area')
                            .annotate(count=Count('id'))
                            .order_by('-count')[:8])
                            
        # 3. Previous Colleges
        colleges = list(StudentEnquiry.objects.values('previous_college')
                        .annotate(count=Count('id'))
                        .order_by('-count')[:5])
                        
        # 4. Course Distribution
        courses = list(StudentEnquiry.objects.values('course_of_interest')
                       .annotate(count=Count('id'))
                       .order_by('-count'))
                       
        # 5. Faculty Performance (leads assigned, conversions achieved)
        faculties = User.objects.filter(role='faculty')
        faculty_performance = []
        for faculty in faculties:
            assigned = StudentEnquiry.objects.filter(assigned_officer=faculty).count()
            converted = StudentEnquiry.objects.filter(assigned_officer=faculty, status='admission_done').count()
            rate = round((converted / assigned * 100), 2) if assigned > 0 else 0.0
            faculty_performance.append({
                'name': faculty.get_full_name() or faculty.username,
                'assigned': assigned,
                'converted': converted,
                'conversion_rate': rate
            })
            
        # 6. Lead Volume Trend over the last 15 days
        now = timezone.now()
        fifteen_days_ago = now - timezone.timedelta(days=15)
        raw_trend = StudentEnquiry.objects.filter(created_at__gte=fifteen_days_ago) \
            .extra(select={'day': "date(created_at)"}) \
            .values('day') \
            .annotate(count=Count('id')) \
            .order_by('day')
            
        trend = []
        # Populate missing dates with 0
        date_dict = {item['day']: item['count'] for item in raw_trend}
        for i in range(16):
            d = (fifteen_days_ago + timezone.timedelta(days=i)).date()
            d_str = d.strftime('%Y-%m-%d')
            # For sqlite/mysql comparability in formatting
            count = date_dict.get(d_str, date_dict.get(d, 0))
            trend.append({
                'date': d.strftime('%b %d'),
                'count': count
            })

        return Response({
            'kpis': kpis,
            'demographics': demographics,
            'colleges': colleges,
            'courses': courses,
            'faculty_performance': faculty_performance,
            'trend': trend
        })


class AdminExportReportView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = StudentEnquiry.objects.all().order_by('-created_at')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
            
        log_audit_event(request.user, f"Exported leads data report (Filter: {start_date} to {end_date})", request)
        
        # Generate CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ems_enquiries_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Name', 'Email', 'Mobile Number', 'Previous College', 
            'City/Village/Area', 'Pincode', 'Course of Interest', 
            'Status', 'Assigned Faculty', 'Date Registered'
        ])
        
        for item in queryset:
            officer_str = item.assigned_officer.get_full_name() or item.assigned_officer.username if item.assigned_officer else "None"
            writer.writerow([
                item.id, item.name, item.email, item.mobile_number, item.previous_college,
                item.city_village_area, item.pincode, item.course_of_interest,
                item.get_status_display(), officer_str, item.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
            
        return response


# --- SUPER ADMIN PORTAL ---
class SuperAdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.all().order_by('id')

    def perform_create(self, serializer):
        user = serializer.save()
        log_audit_event(self.request.user, f"Created new user account: {user.username} ({user.role})", self.request)

    def perform_update(self, serializer):
        user = serializer.save()
        log_audit_event(self.request.user, f"Updated user account: {user.username}", self.request)

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        log_audit_event(self.request.user, f"Deleted user account: {username}", self.request)


class SuperAdminFAQViewSet(viewsets.ModelViewSet):
    serializer_class = ChatbotFAQSerializer
    permission_classes = [IsSuperAdmin]
    queryset = ChatbotFAQ.objects.all().order_by('id')

    def perform_create(self, serializer):
        faq = serializer.save()
        log_audit_event(self.request.user, f"Created Chatbot FAQ: {faq.question[:30]}...", self.request)

    def perform_update(self, serializer):
        faq = serializer.save()
        log_audit_event(self.request.user, f"Updated Chatbot FAQ: {faq.question[:30]}...", self.request)

    def perform_destroy(self, instance):
        question = instance.question
        instance.delete()
        log_audit_event(self.request.user, f"Deleted Chatbot FAQ: {question[:30]}...", self.request)


class SuperAdminConfigView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        configs = SystemConfiguration.objects.all()
        mappings = CourseAllocationMapping.objects.all()
        return Response({
            'configs': SystemConfigurationSerializer(configs, many=True).data,
            'mappings': CourseAllocationMappingSerializer(mappings, many=True).data
        })

    def post(self, request):
        configs_data = request.data.get('configs', [])
        mappings_data = request.data.get('mappings', [])

        # 1. Update Configs
        for cfg in configs_data:
            key = cfg.get('key')
            val = cfg.get('value')
            if key and val is not None:
                SystemConfiguration.objects.update_or_create(key=key, defaults={'value': val})

        # 2. Update Mappings (Clear and Re-create is simple)
        if mappings_data:
            # Drop old mappings
            CourseAllocationMapping.objects.all().delete()
            for m in mappings_data:
                course = m.get('course_name')
                faculty_id = m.get('faculty')
                if course and faculty_id:
                    try:
                        faculty = User.objects.get(id=faculty_id)
                        CourseAllocationMapping.objects.create(course_name=course, faculty=faculty)
                    except User.DoesNotExist:
                        pass

        log_audit_event(request.user, "Updated Lead Routing Configuration settings", request)
        return Response({'message': 'Configuration updated successfully'})


class SuperAdminAuditLogView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-created_at')[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


# --- AI CHATBOT WIDGET ---
class ChatbotAskView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'answer': 'Please send a valid message.'})

        # Step 1: Query the local FAQ database for matching keywords
        local_answer = self.search_local_faq(user_message)
        if local_answer:
            return Response({
                'answer': local_answer,
                'source': 'FAQ Database'
            })

        # Step 2: Try calling Gemini AI if API Key is in env
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            gemini_answer = self.call_gemini_api(user_message, api_key)
            if gemini_answer:
                return Response({
                    'answer': gemini_answer,
                    'source': 'Google Gemini AI'
                })

        # Step 3: Local intelligent fallback responder if both fail
        fallback_answer = self.get_smart_fallback(user_message)
        return Response({
            'answer': fallback_answer,
            'source': 'Smart Fallback Engine'
        })

    def search_local_faq(self, user_message):
        """Simple keyword overlap check against FAQ database."""
        faqs = ChatbotFAQ.objects.all()
        query_words = set(user_message.lower().split())
        
        best_match = None
        best_score = 0

        for faq in faqs:
            # Clean and split question
            q_clean = faq.question.lower().replace('?', '').replace('!', '').replace('.', '')
            q_words = set(q_clean.split())
            
            # Simple intersection
            overlap = query_words.intersection(q_words)
            score = len(overlap)
            
            # Boost score for exact substring match
            if q_clean in user_message.lower():
                score += 5
                
            if score > best_score and score >= 2: # Need at least 2 matching words or exact substring
                best_score = score
                best_match = faq

        if best_match:
            return best_match.answer
        return None

    def call_gemini_api(self, user_message, api_key):
        """Calls Google Gemini API directly using urllib."""
        # Grab FAQs context to build prompt
        faqs = ChatbotFAQ.objects.all()[:15]
        faq_context = ""
        for faq in faqs:
            faq_context += f"Q: {faq.question}\nA: {faq.answer}\n\n"

        prompt = (
            f"You are a helpful admission assistant for Karmaveer Bhaurao Patil Institute of Management Studies and Research (KBPIMSR). "
            f"Here is the official Frequently Asked Questions (FAQ) context:\n\n{faq_context}\n"
            f"Answer the following student query using the context above if relevant. If you cannot find the answer, "
            f"guide them to contact the admission office at +91 02162-230011 or email info@kbpimsr.ac.in.\n\n"
            f"Student Query: \"{user_message}\"\n\nAnswer:"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 400
            }
        }

        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                return text.strip()
        except Exception as e:
            # Log failure silently, fallback will take over
            print(f"Gemini API failure: {e}")
            return None

    def get_smart_fallback(self, user_message):
        """Intelligent regex-based offline responder."""
        msg = user_message.lower()
        
        if any(w in msg for w in ['hello', 'hi', 'hey', 'greetings']):
            return "Hello! Welcome to the KBPIMSR Enquiry Helpdesk. How can I assist you with admissions today?"
            
        if any(w in msg for w in ['course', 'program', 'degree', 'mca', 'mba', 'bba', 'bca']):
            return ("KBPIMSR offers MBA (Master of Business Administration), MCA (Master of Computer Applications), "
                    "BBA (Bachelor of Business Administration), and BCA (Bachelor of Computer Applications). "
                    "Which course are you interested in so I can provide more details?")
                    
        if any(w in msg for w in ['fee', 'cost', 'charge', 'price']):
            return ("Fee structures vary by course and government regulations. For MBA and MCA, fees are approx. "
                    "₹80,000 - ₹95,000 per year. For detailed fee breakdowns, please fill out the Enquiry Form, and "
                    "our assigned Admission Officer will contact you directly with scholarship options.")
                    
        if any(w in msg for w in ['placement', 'job', 'salary', 'recruit']):
            return ("KBPIMSR has an active Training and Placement Cell. Our students are placed in top companies like "
                    "TCS, Wipro, Infosys, ICICI Bank, and HDFC. Average packages range from ₹3.5 LPA to ₹6 LPA.")
                    
        if any(w in msg for w in ['contact', 'phone', 'email', 'number', 'address', 'location', 'where']):
            return ("KBPIMSR is located at Satara, Maharashtra (kbpimsr.ac.in). "
                    "You can reach the Admissions Office at +91 02162-230011 or email info@kbpimsr.ac.in.")
                    
        return ("Thank you for your question! I don't have the exact details on that in my offline knowledge base. "
                "Please submit the Enquiry Form on the main page, and your assigned Admission Officer will get in touch "
                "with you shortly to answer all your queries.")
