from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import User, StudentEnquiry, InteractionLog, SystemConfiguration, CourseAllocationMapping

class LeadAllocationTestCase(TestCase):
    def setUp(self):
        # Create default configs
        self.config = SystemConfiguration.objects.create(
            key='routing_logic',
            value='round_robin'
        )

        # Create active faculty members
        self.f1 = User.objects.create_user(
            username='faculty1',
            email='f1@kbpimsr.ac.in',
            password='testpassword',
            role='faculty',
            status='active'
        )
        self.f2 = User.objects.create_user(
            username='faculty2',
            email='f2@kbpimsr.ac.in',
            password='testpassword',
            role='faculty',
            status='active'
        )

    def test_round_robin_allocation(self):
        # First enquiry should go to first active faculty (sorted by ID)
        e1 = StudentEnquiry.objects.create(
            name="Test Student 1",
            email="s1@gmail.com",
            mobile_number="9876543211",
            previous_college="Prev Coll 1",
            city_village_area="Satara",
            pincode="415001",
            course_of_interest="MBA"
        )
        from core.routing_logic import allocate_lead
        allocate_lead(e1)
        self.assertEqual(e1.assigned_officer, self.f1)

        # Second enquiry should go to second active faculty
        e2 = StudentEnquiry.objects.create(
        name="Test Student 2",
        email="s2@gmail.com",
        mobile_number="9876543212",
        previous_college="Prev Coll 2",
        city_village_area="Karad",
        pincode="415002",
        course_of_interest="BSc Computer Science"
        )
        allocate_lead(e2)
        self.assertEqual(e2.assigned_officer, self.f2)

        # Third enquiry should rotate back to first active faculty
        e3 = StudentEnquiry.objects.create(
            name="Test Student 3",
            email="s3@gmail.com",
            mobile_number="9876543213",
            previous_college="Prev Coll 3",
            city_village_area="Wai",
            pincode="415003",
            course_of_interest="BBA"
        )
        allocate_lead(e3)
        self.assertEqual(e3.assigned_officer, self.f1)

    def test_course_based_allocation_and_fallback(self):
        # Update config to course_based
        self.config.value = 'course_based'
        self.config.save()

        # Map MCA to faculty2, MBA to faculty1
        CourseAllocationMapping.objects.create(course_name='BSc Computer Science', faculty=self.f2)
        CourseAllocationMapping.objects.create(course_name='MBA', faculty=self.f1)

        # 1. Enquiry for MCA should go to faculty2
        e_mca = StudentEnquiry.objects.create(
        name="BSc CS Student",
        email="bsccs@gmail.com",
        mobile_number="9876543220",
        previous_college="Prev Coll",
        city_village_area="Satara",
        pincode="415001",
        course_of_interest="BSc Computer Science" # <-- Updated here
        )
        from core.routing_logic import allocate_lead
        allocate_lead(e_mca)
        self.assertEqual(e_mca.assigned_officer, self.f2)

        # 2. Enquiry for MBA should go to faculty1
        e_mba = StudentEnquiry.objects.create(
            name="MBA Student",
            email="mba@gmail.com",
            mobile_number="9876543221",
            previous_college="Prev Coll",
            city_village_area="Satara",
            pincode="415001",
            course_of_interest="MBA"
        )
        allocate_lead(e_mba)
        self.assertEqual(e_mba.assigned_officer, self.f1)

        # 3. Enquiry for BBA (no mapping) should fall back to general round-robin (f2 is next in queue)
        e_bba = StudentEnquiry.objects.create(
            name="BBA Student",
            email="bba@gmail.com",
            mobile_number="9876543222",
            previous_college="Prev Coll",
            city_village_area="Satara",
            pincode="415001",
            course_of_interest="BBA"
        )
        allocate_lead(e_bba)
        # Sequence of assignments: e_mca (f2), e_mba (f1). Last assigned was f1. Next is f2!
        self.assertEqual(e_bba.assigned_officer, self.f2)


class APIRoleBasedAccessTestCase(APITestCase):
    def setUp(self):
        # Create users of different roles
        self.super_admin = User.objects.create_user(
            username='super_admin_user',
            email='sa@kbpimsr.ac.in',
            password='sa_password',
            role='super_admin'
        )
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@kbpimsr.ac.in',
            password='admin_password',
            role='admin'
        )
        self.faculty = User.objects.create_user(
            username='faculty_user',
            email='faculty@kbpimsr.ac.in',
            password='faculty_password',
            role='faculty'
        )

        # Generate tokens
        from rest_framework.authtoken.models import Token
        self.sa_token = Token.objects.create(user=self.super_admin).key
        self.admin_token = Token.objects.create(user=self.admin).key
        self.faculty_token = Token.objects.create(user=self.faculty).key

    def test_superadmin_endpoints_restricted(self):
        url = reverse('user-list') # /api/users/

        # Faculty should be denied
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.faculty_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin should be denied
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Super Admin should be allowed
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.sa_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_analytics_endpoint_restricted(self):
        url = reverse('admin-analytics') # /api/admin/analytics/

        # Faculty should be denied
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.faculty_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin should be allowed
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Super Admin should be allowed
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.sa_token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
