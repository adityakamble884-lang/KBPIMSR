import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import User, StudentEnquiry, InteractionLog, SystemConfiguration, CourseAllocationMapping, ChatbotFAQ, AuditLog

class Command(BaseCommand):
    help = 'Seeds initial data including configs, roles, course maps, FAQs, and mock leads with log histories.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        # 1. System Configuration
        SystemConfiguration.objects.all().delete()
        routing_config = SystemConfiguration.objects.create(
            key='routing_logic',
            value='round_robin',
            description='System-wide lead allocation routing algorithm. Values: "round_robin" or "course_based"'
        )
        self.stdout.write("Created default system configurations.")

        # 2. User Accounts
        # Delete existing to prevent overlaps in development
        StudentEnquiry.objects.all().delete()
        User.objects.all().delete()

        super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@kbpimsr.ac.in',
            password='admin123',
            role='super_admin',
            first_name='Admin',
            last_name='System'
        )
        admin = User.objects.create_user(
            username='admin',
            email='admin@kbpimsr.ac.in',
            password='admin123',
            role='admin',
            first_name='Prof. Rajesh',
            last_name='Shinde'
        )
        f1 = User.objects.create_user(
            username='faculty1',
            email='faculty1@kbpimsr.ac.in',
            password='admin123',
            role='faculty',
            phone_number='+919876543210',
            first_name='Dr. Sanjay',
            last_name='Patil'
        )
        f2 = User.objects.create_user(
            username='faculty2',
            email='faculty2@kbpimsr.ac.in',
            password='admin123',
            role='faculty',
            phone_number='+919876543211',
            first_name='Prof. Meera',
            last_name='Deshmukh'
        )
        f3 = User.objects.create_user(
            username='faculty3',
            email='faculty3@kbpimsr.ac.in',
            password='admin123',
            role='faculty',
            phone_number='+919876543212',
            first_name='Dr. Anil',
            last_name='Kulkarni'
        )
        self.stdout.write("Created Super Admin, Admin, and 3 Faculty accounts.")

        # 3. Course Mappings
        CourseAllocationMapping.objects.all().delete()
        CourseAllocationMapping.objects.create(course_name='MBA', faculty=f1)
        CourseAllocationMapping.objects.create(course_name='MCA', faculty=f2)
        CourseAllocationMapping.objects.create(course_name='BBA', faculty=f3)
        CourseAllocationMapping.objects.create(course_name='BCA', faculty=f1)
        self.stdout.write("Created course allocation mappings.")

        # 4. FAQs
        ChatbotFAQ.objects.all().delete()
        faqs = [
            {
                'question': 'What courses are offered at KBPIMSR?',
                'answer': 'KBPIMSR Satara offers MBA (Master of Business Administration), MCA (Master of Computer Applications), BBA (Bachelor of Business Administration), and BCA (Bachelor of Computer Applications). All courses are affiliated with Shivaji University, Kolhapur and approved by AICTE.',
                'category': 'Courses'
            },
            {
                'question': 'What are the eligibility criteria for MCA?',
                'answer': 'To be eligible for the MCA course, a candidate must have completed a Bachelor\'s degree with at least 50% marks (45% for reserved categories) and must have studied Mathematics at the 10+2 level or at the Graduation level. A valid MAH-MCA-CET score is compulsory.',
                'category': 'Eligibility'
            },
            {
                'question': 'What is the eligibility for the MBA program?',
                'answer': 'For MBA, the candidate must possess a Bachelor\'s degree of minimum 3 years with at least 50% marks (45% for reserved category). A valid score in MAH-MBA/MMS-CET, CAT, or CMAT exams is required.',
                'category': 'Eligibility'
            },
            {
                'question': 'What is the fee structure for MBA and MCA courses?',
                'answer': 'The tuition fees are approximately ₹85,000 to ₹95,000 per year, subject to revision by the Fees Regulating Authority (FRA). Scholarships and fee concessions are available for OBC, EBC, SC, ST, and VJNT students as per Government rules.',
                'category': 'Fees'
            },
            {
                'question': 'How are the placements at KBPIMSR?',
                'answer': 'KBPIMSR has a highly active Training and Placement Cell. Our major recruiters include TCS, Wipro, Cognizant, Infosys, ICICI Bank, and HDFC Bank. The average salary package is around ₹4.2 LPA, with the highest package reaching ₹7.5 LPA.',
                'category': 'Placements'
            },
            {
                'question': 'Is hostel accommodation available?',
                'answer': 'Yes, KBPIMSR provides separate hostel facilities for boys and girls with clean dining rooms, high-speed Wi-Fi connectivity, recreation halls, and 24/7 security services.',
                'category': 'Facilities'
            },
            {
                'question': 'What documents are required for admission?',
                'answer': 'Required documents include: CET Score Card, SSC (10th) & HSC (12th) Marksheets, Graduation Marksheets (if applicable), School/College Leaving Certificate, Caste Certificate & Caste Validity (if applicable), Non-Creamy Layer Certificate, Domicile Certificate, and Passport-size Photos.',
                'category': 'Documents'
            },
            {
                'question': 'Where is KBPIMSR located and how to contact them?',
                'answer': 'Karmaveer Bhaurao Patil Institute of Management Studies and Research is located in Satara, Maharashtra (kbpimsr.ac.in). Contact phone numbers: +91 02162-230011, and email: info@kbpimsr.ac.in.',
                'category': 'Contact'
            }
        ]
        for faq in faqs:
            ChatbotFAQ.objects.create(**faq)
        self.stdout.write("Created initial Chatbot FAQ list.")

        # 5. Mock Student Enquiries & Interaction Logs
        names = [
            "Rahul Sharma", "Priya Patil", "Amit Deshmukh", "Sneha Kulkarni", 
            "Rohit Shinde", "Anjali Joshi", "Aditya Sawant", "Snehal Jadhav", 
            "Vikram Raje", "Sayali Chavan", "Abhishek Yadav", "Divya Mohite", 
            "Manoj Pawar", "Nehal Mane", "Pranav Nikam"
        ]
        emails = [n.lower().replace(" ", ".") + "@gmail.com" for n in names]
        mobiles = [f"+919923{random.randint(100000, 999999)}" for _ in range(len(names))]
        colleges = [
            "YS College of Arts and Commerce, Satara", 
            "LBS College, Satara", 
            "Dhananjayrao Gadgil College of Commerce, Satara",
            "Savitribai Phule Mahila Mahavidyalaya, Satara",
            "KBP College of Engineering, Satara"
        ]
        cities = ["Satara", "Karad", "Wai", "Phaltan", "Koregaon", "Medha", "Mahabaleshwar"]
        courses = ["MBA", "MCA", "BBA", "BCA"]
        statuses = ["new_lead", "contacted", "in_progress", "campus_visited", "admission_done", "dropped"]
        faculties = [f1, f2, f3]

        now = timezone.now()

        # Let's seed 15 student leads distributed over the last 15 days
        for i in range(len(names)):
            days_ago = len(names) - i # staggered creation dates
            created_time = now - timezone.timedelta(days=days_ago, hours=random.randint(1, 23))
            
            # Select random attributes
            course = random.choice(courses)
            city = random.choice(cities)
            pincode = str(415000 + random.randint(1, 200))
            college = random.choice(colleges)
            
            # Determine status based on standard progression distribution
            if i < 3:
                status_choice = "new_lead"
            elif i < 6:
                status_choice = "contacted"
            elif i < 9:
                status_choice = "in_progress"
            elif i < 11:
                status_choice = "campus_visited"
            elif i < 14:
                status_choice = "admission_done"
            else:
                status_choice = "dropped"
                
            # Assign officer
            officer = random.choice(faculties)
            
            # Save enquiry (need to bypass auto_now_add for historical date)
            enquiry = StudentEnquiry.objects.create(
                name=names[i],
                email=emails[i],
                mobile_number=mobiles[i],
                previous_college=college,
                city_village_area=city,
                pincode=pincode,
                course_of_interest=course,
                status=status_choice,
                assigned_officer=officer
            )
            # Override created_at
            StudentEnquiry.objects.filter(id=enquiry.id).update(created_at=created_time)
            enquiry.refresh_from_db()

            # Create Interaction Logs
            # Log 1: Automated assignment
            log_time = created_time + timezone.timedelta(minutes=5)
            InteractionLog.objects.create(
                student=enquiry,
                officer=None,
                note=f"Lead automatically captured and allocated to {officer.first_name} {officer.last_name}.",
                status_changed_to='new_lead',
                created_at=log_time
            )
            InteractionLog.objects.filter(student=enquiry).update(created_at=log_time)
            
            # Log 2: Initial follow-up (if not new_lead)
            if status_choice != 'new_lead':
                log_time2 = created_time + timezone.timedelta(days=1, hours=random.randint(1, 4))
                note = "Called candidate. Discussed course highlights, eligibility, and shared syllabus booklet."
                InteractionLog.objects.create(
                    student=enquiry,
                    officer=officer,
                    note=note,
                    status_changed_to='contacted',
                    created_at=log_time2
                )
                
            # Log 3: Intermediate status
            if status_choice in ['in_progress', 'campus_visited', 'admission_done']:
                log_time3 = created_time + timezone.timedelta(days=2, hours=random.randint(1, 4))
                note = "Followed up. Student requested details about scholarships and hostel accommodations. Added to priority follow-up."
                InteractionLog.objects.create(
                    student=enquiry,
                    officer=officer,
                    note=note,
                    status_changed_to='in_progress',
                    created_at=log_time3
                )
                
            # Log 4: Campus Visit / Done
            if status_choice in ['campus_visited', 'admission_done']:
                log_time4 = created_time + timezone.timedelta(days=4, hours=random.randint(1, 4))
                note = "Student visited the campus along with parents. Met the HOD, toured the IT labs and library. Highly satisfied."
                InteractionLog.objects.create(
                    student=enquiry,
                    officer=officer,
                    note=note,
                    status_changed_to='campus_visited',
                    created_at=log_time4
                )
                
            # Log 5: Admission Completed
            if status_choice == 'admission_done':
                log_time5 = created_time + timezone.timedelta(days=5, hours=random.randint(1, 4))
                note = "Admission formalities completed. Registered candidate in Shivaji University portal. Verified all certificates and marksheets."
                InteractionLog.objects.create(
                    student=enquiry,
                    officer=officer,
                    note=note,
                    status_changed_to='admission_done',
                    created_at=log_time5
                )

            # Log 6: Dropped
            if status_choice == 'dropped':
                log_time_dropped = created_time + timezone.timedelta(days=3)
                note = "Student informed that they have selected a college in Pune instead. Dropping lead from active list."
                InteractionLog.objects.create(
                    student=enquiry,
                    officer=officer,
                    note=note,
                    status_changed_to='dropped',
                    created_at=log_time_dropped
                )

        self.stdout.write("Created 15 mock leads with chronological interaction log histories.")

        # 6. Audit Logs
        AuditLog.objects.all().delete()
        AuditLog.objects.create(
            user=super_admin,
            action="System initialized and dummy database successfully seeded",
            ip_address="127.0.0.1"
        )
        self.stdout.write("Created initial seed audit log.")
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
