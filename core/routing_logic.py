from core.models import User, SystemConfiguration, CourseAllocationMapping, StudentEnquiry

def allocate_lead(enquiry):
    """
    Allocates the lead to a faculty member based on system configuration.
    Returns the assigned User instance or None if no faculty is available.
    """
    # 1. Fetch routing configuration
    try:
        config = SystemConfiguration.objects.get(key='routing_logic')
        logic = config.value
    except SystemConfiguration.DoesNotExist:
        logic = 'round_robin'

    # 2. Get active faculty list
    active_faculty = list(User.objects.filter(
        role='faculty',
        status='active',
        is_active=True
    ).order_by('id'))

    if not active_faculty:
        return None

    # 3. Apply routing logic
    assigned_officer = None

    if logic == 'course_based':
        # Check course allocation map
        try:
            mapping = CourseAllocationMapping.objects.get(course_name=enquiry.course_of_interest)
            # Make sure mapped faculty is active
            if mapping.faculty in active_faculty:
                assigned_officer = mapping.faculty
        except CourseAllocationMapping.DoesNotExist:
            pass

    # Fallback to round-robin if course-based didn't yield an active officer
    if not assigned_officer:
        assigned_officer = get_next_round_robin_officer(active_faculty)

    if assigned_officer:
        enquiry.assigned_officer = assigned_officer
        enquiry.save()
        
    return assigned_officer

def get_next_round_robin_officer(active_faculty):
    if not active_faculty:
        return None
        
    # Get the last enquiry that was successfully assigned
    last_assigned_enquiry = StudentEnquiry.objects.exclude(assigned_officer=None).order_by('-id').first()
    
    if not last_assigned_enquiry or not last_assigned_enquiry.assigned_officer:
        return active_faculty[0]
        
    last_officer = last_assigned_enquiry.assigned_officer
    
    # Find index of last officer in the active faculty list
    try:
        last_index = active_faculty.index(last_officer)
        next_index = (last_index + 1) % len(active_faculty)
        return active_faculty[next_index]
    except ValueError:
        # Last officer is no longer active or list changed, return the first one
        return active_faculty[0]
