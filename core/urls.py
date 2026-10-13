from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    UserLoginView, EnquirySubmitView, FacultyLeadsViewSet, 
    AdminAnalyticsView, AdminExportReportView, SuperAdminUserViewSet, 
    SuperAdminFAQViewSet, SuperAdminConfigView, SuperAdminAuditLogView, 
    ChatbotAskView
)

router = DefaultRouter()
router.register(r'leads', FacultyLeadsViewSet, basename='lead')
router.register(r'users', SuperAdminUserViewSet, basename='user')
router.register(r'faqs', SuperAdminFAQViewSet, basename='faq')

urlpatterns = [
    path('auth/login/', UserLoginView.as_view(), name='auth-login'),
    path('enquiry/submit/', EnquirySubmitView.as_view(), name='enquiry-submit'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/export/', AdminExportReportView.as_view(), name='admin-export'),
    path('superadmin/config/', SuperAdminConfigView.as_view(), name='superadmin-config'),
    path('superadmin/audit-logs/', SuperAdminAuditLogView.as_view(), name='superadmin-audit-logs'),
    path('chatbot/ask/', ChatbotAskView.as_view(), name='chatbot-ask'),
    path('', include(router.urls)),
]
