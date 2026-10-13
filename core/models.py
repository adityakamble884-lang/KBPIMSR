from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('faculty', 'Faculty'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='faculty')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class StudentEnquiry(models.Model):
    COURSE_CHOICES = (
        ('MBA', 'MBA - Master of Business Administration'),
        ('MCA', 'MCA - Master of Computer Applications'),
        ('BBA', 'BBA - Bachelor of Business Administration'),
        ('BCA', 'BCA - Bachelor of Computer Applications'),
    )
    
    STATUS_CHOICES = (
        ('new_lead', 'New Lead'),
        ('contacted', 'Contacted'),
        ('in_progress', 'In-Progress'),
        ('campus_visited', 'Campus Visited'),
        ('admission_done', 'Admission Done'),
        ('dropped', 'Dropped'),
    )
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['email', 'mobile_number'], 
                name='unique_enquiry_email_phone'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.email}"
    
    name = models.CharField(max_length=100)
    email = models.EmailField()
    mobile_number = models.CharField(max_length=15)
    previous_college = models.CharField(max_length=150)
    city_village_area = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    course_of_interest = models.CharField(max_length=10, choices=COURSE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new_lead')
    assigned_officer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_enquiries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.course_of_interest}"

class InteractionLog(models.Model):
    student = models.ForeignKey(StudentEnquiry, on_delete=models.CASCADE, related_name='interaction_logs')
    officer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    note = models.TextField()
    status_changed_to = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log for {self.student.name} by {self.officer.username if self.officer else 'System'} on {self.created_at}"

class SystemConfiguration(models.Model):
    key = models.CharField(max_length=50, unique=True)
    value = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class CourseAllocationMapping(models.Model):
    course_name = models.CharField(max_length=20, unique=True)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_allocations')

    def __str__(self):
        return f"{self.course_name} -> {self.faculty.username}"

class ChatbotFAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=50, default='General')

    def __str__(self):
        return self.question

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_str = self.user.username if self.user else "Anonymous"
        return f"[{self.created_at}] {user_str}: {self.action}"
