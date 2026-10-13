from rest_framework import serializers
from core.models import User, StudentEnquiry, InteractionLog, SystemConfiguration, CourseAllocationMapping, ChatbotFAQ, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'status', 'is_active', 'password')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class InteractionLogSerializer(serializers.ModelSerializer):
    officer_username = serializers.CharField(source='officer.username', read_only=True)

    class Meta:
        model = InteractionLog
        fields = ('id', 'student', 'officer', 'officer_username', 'note', 'status_changed_to', 'created_at')

class StudentEnquirySerializer(serializers.ModelSerializer):
    assigned_officer_detail = UserSerializer(source='assigned_officer', read_only=True)
    interaction_logs = InteractionLogSerializer(many=True, read_only=True)

    class Meta:
        model = StudentEnquiry
        fields = (
            'id', 'name', 'email', 'mobile_number', 'previous_college', 
            'city_village_area', 'pincode', 'course_of_interest', 
            'status', 'assigned_officer', 'assigned_officer_detail', 
            'interaction_logs', 'created_at', 'updated_at'
        )

class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = ('id', 'key', 'value', 'description')

class CourseAllocationMappingSerializer(serializers.ModelSerializer):
    faculty_username = serializers.CharField(source='faculty.username', read_only=True)

    class Meta:
        model = CourseAllocationMapping
        fields = ('id', 'course_name', 'faculty', 'faculty_username')

class ChatbotFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotFAQ
        fields = ('id', 'question', 'answer', 'category')

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'username', 'action', 'ip_address', 'created_at')
