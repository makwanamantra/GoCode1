import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import (
    UserProfile, ProjectTemplate, CustomRequest, Project, Task,
    Deliverable, ChatMessage, Payment, AuditLog, Resume, LoginHistory
)

class Command(BaseCommand):
    help = 'Populate system with 50+ real-world project templates, users, requests, projects, and deliverables'

    def handle(self, *args, **options):
        self.stdout.write('Seeding initial data...')

        # 1. Users & Profiles
        owner_user, _ = User.objects.get_or_create(username='owner_admin', email='owner@agency.com')
        owner_user.set_password('admin123')
        owner_user.is_staff = True
        owner_user.is_superuser = True
        owner_user.save()
        UserProfile.objects.update_or_create(
            user=owner_user,
            defaults={'role': 'OWNER', 'sub_role': 'NONE', 'company': 'Aura Studio Agency', 'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
        )

        emp_data = [
            ('alex_dev', 'alex@agency.com', 'FRONTEND', 'Alex Rivera', 4200.00, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'),
            ('sarah_backend', 'sarah@agency.com', 'BACKEND', 'Sarah Chen', 5800.00, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'),
            ('david_uiux', 'david@agency.com', 'UIUX', 'David Vance', 3900.00, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'),
            ('elena_fullstack', 'elena@agency.com', 'FULLSTACK', 'Elena Rostova', 6400.00, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'),
            ('marcus_devops', 'marcus@agency.com', 'DEVOPS', 'Marcus Vance', 4800.00, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80')
        ]

        employees = []
        for username, email, sub_role, full_name, earned, avatar in emp_data:
            u, _ = User.objects.get_or_create(username=username, email=email)
            u.set_password('emp123')
            u.first_name = full_name.split()[0]
            u.last_name = full_name.split()[1]
            u.save()
            p, _ = UserProfile.objects.update_or_create(
                user=u,
                defaults={'role': 'EMPLOYEE', 'sub_role': sub_role, 'company': 'Aura Studio', 'total_earned': earned, 'avatar_url': avatar}
            )
            employees.append(u)

        client_user, _ = User.objects.get_or_create(username='john_client', email='john@acme.com')
        client_user.set_password('client123')
        client_user.first_name = "John"
        client_user.last_name = "Smith"
        client_user.save()
        UserProfile.objects.update_or_create(
            user=client_user,
            defaults={'role': 'CLIENT', 'sub_role': 'NONE', 'company': 'Acme Global Corp', 'avatar_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'}
        )

        client2, _ = User.objects.get_or_create(username='lisa_client', email='lisa@horizon.io')
        client2.set_password('client123')
        client2.first_name = "Lisa"
        client2.last_name = "Ray"
        client2.save()
        UserProfile.objects.update_or_create(
            user=client2,
            defaults={'role': 'CLIENT', 'sub_role': 'NONE', 'company': 'Horizon Web3', 'avatar_url': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'}
        )

        # 2. Seed 50 Project Templates
        categories = ['3D WebGL', 'SaaS Platform', 'E-Commerce', 'Mobile App', 'AI & ML', 'Cyber Security', 'Fintech', 'Creative Portfolio']
        sample_videos = [
            'https://assets.mixkit.co/videos/preview/mixkit-cyber-monday-shopping-animation-41484-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-screens-of-a-data-center-40010-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-hud-display-42875-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-3d-render-of-a-glowing-sphere-network-41586-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-glowing-lines-in-a-looping-circuit-board-41583-large.mp4'
        ]

        tag_list = ['React', 'Three.js', 'Lenis', 'GSAP', 'Django', 'TailwindCSS', 'WebGL', 'TypeScript', 'Node.js', 'Next.js']

        ProjectTemplate.objects.all().delete()
        templates_to_create = []

        template_titles = [
            ("Lusion Nexus 3D Experience", "3D WebGL", 3499.00, "Immersive 3D interactive portfolio inspired by Lusion & Tympanus."),
            ("Aupale Premium Luxury Engine", "3D WebGL", 4200.00, "Liquid WebGL shaders with Lenis inertia physics and smooth custom cursor."),
            ("Codrops Stack Motion UI", "3D WebGL", 2800.00, "3D multi-layered card gallery motion with React Three Fiber."),
            ("AstIsland Astro Hero Platform", "SaaS Platform", 3100.00, "Sleek light-themed hero canvas with interactive floating glass islands."),
            ("n8ao Ambient Shader Portal", "3D WebGL", 3900.00, "Real-time Ambient Occlusion SSAO shaders with reactive particles."),
            ("PellMell Dynamic Scroll Universe", "3D WebGL", 3600.00, "Column & row smooth scroll grid with GSAP parallax triggers."),
            ("OmniAI Intelligence Hub", "AI & ML", 4800.00, "AI agent prompt workbench with real-time stream visualizer."),
            ("Nova Crypto Exchange Pro", "Fintech", 5500.00, "High frequency trading portal with WebGL charts and real-time websocket feed."),
            ("Hyperion Cyber Defense Suite", "Cyber Security", 4900.00, "Threat map matrix with interactive 3D globe node visualization."),
            ("Aura Luxe E-Commerce Engine", "E-Commerce", 3700.00, "3D product configurator with AR preview and Stripe Checkout integration."),
            ("Pulse Fitness AR App", "Mobile App", 2900.00, "React Native cross-platform motion app with real-time workout tracking."),
            ("Vortex Audio Visualizer", "Creative Portfolio", 2400.00, "Web Audio API powered reactive 3D sphere canvas."),
            ("Titan Enterprise ERP System", "SaaS Platform", 6500.00, "Multi-tenant business suite with role access and automated invoices."),
            ("Zenith Minimalist Architect Gallery", "Creative Portfolio", 2600.00, "Ultra clean typography & Lenis inertia scrolling for architects."),
            ("Sphere AI Data Pipeline", "AI & ML", 4300.00, "Node-based visual workflow builder for machine learning pipelines."),
            ("Spectra Web3 Metaverse Hub", "3D WebGL", 5200.00, "R3F 3D avatar workspace with spatial spatial audio chat."),
            ("Orion Logistics Fleet Tracker", "SaaS Platform", 3800.00, "Real-time GPS vehicle location dashboard with predictive AI routes."),
            ("Solaria Green Energy Monitor", "SaaS Platform", 3300.00, "Solar yield analytics dashboard with interactive SVG chart widgets."),
            ("Velocity SaaS Billing Engine", "Fintech", 3100.00, "Recurring subscription management portal with usage-based billing."),
            ("Prism Augmented Reality Showroom", "3D WebGL", 4600.00, "Interactive WebXR furniture placement engine for luxury retail.")
        ]

        # Generate 50 template items total
        for i in range(1, 51):
            idx = (i - 1) % len(template_titles)
            t_base, cat_base, p_base, desc_base = template_titles[idx]
            title = f"{t_base} v{i}" if i > len(template_titles) else t_base
            price = p_base + random.randint(-200, 500)
            vid = sample_videos[i % len(sample_videos)]
            tags = ", ".join(random.sample(tag_list, 4))
            
            templates_to_create.append(ProjectTemplate(
                title=title,
                category=cat_base,
                description=desc_base + " Fully customized with light & dark theme toggles, video proofs, and GSAP micro-animations.",
                price=price,
                preview_video_url=vid,
                demo_url="https://r3f.docs.pmnd.rs/getting-started/examples",
                tags=tags,
                rating=round(random.uniform(4.7, 5.0), 1),
                downloads_count=random.randint(45, 380)
            ))

        ProjectTemplate.objects.bulk_create(templates_to_create)
        self.stdout.write(self.style.SUCCESS(f"Created {len(templates_to_create)} templates."))

        # 3. Seed Custom Requests
        req1 = CustomRequest.objects.create(
            client=client_user,
            title="Custom WebGL Interactive Car Showroom",
            description="Need a high-performance 3D WebGL configurator for custom vehicles with custom paint shaders, glass reflection, and dynamic engine sound controls.",
            category="3D WebGL",
            user_budget=5000.00,
            admin_proposed_price=5500.00,
            admin_predicted_date=(timezone.now() + timedelta(days=25)).date(),
            status="ADMIN_OFFER"
        )

        req2 = CustomRequest.objects.create(
            client=client2,
            title="Web3 Decentralized Asset Analytics",
            description="Build a full-stack Django + React portal monitoring cross-chain liquidity pools with animated R3F charts and dark/light theme switch.",
            category="Fintech",
            user_budget=7000.00,
            admin_proposed_price=7200.00,
            admin_predicted_date=(timezone.now() + timedelta(days=30)).date(),
            status="APPROVED"
        )

        # 4. Seed Projects
        p1 = Project.objects.create(
            custom_request=req2,
            client=client2,
            title="Horizon Crypto Liquidity Dashboard",
            description="Decentralized liquidity pool tracking system with WebGL animations, Django backend, and live alert webhooks.",
            total_budget=7200.00,
            advance_paid=True,
            advance_amount=2160.00,
            final_paid=False,
            status="IN_PROGRESS",
            predicted_completion_date=(timezone.now() + timedelta(days=20)).date()
        )

        p2 = Project.objects.create(
            template=ProjectTemplate.objects.first(),
            client=client_user,
            title="Acme Lusion 3D Brand Portal",
            description="Luxury interactive 3D brand portal built with Lenis smooth scroll and Drei shader canvas.",
            total_budget=3499.00,
            advance_paid=True,
            advance_amount=1049.70,
            final_paid=True,
            status="COMPLETED",
            predicted_completion_date=(timezone.now() - timedelta(days=2)).date()
        )

        # 5. Tasks Breakdown (Divided among developers)
        t1 = Task.objects.create(
            project=p1,
            assigned_employee=employees[0], # Frontend
            role_type='FRONTEND',
            title="Implement R3F 3D Liquidity Particle System",
            description="Create interactive 3D node network graph using @react-three/fiber, drei, and Lenis smooth scroll inertia.",
            payout=1500.00,
            status="IN_PROGRESS",
            due_date=(timezone.now() + timedelta(days=8)).date()
        )

        t2 = Task.objects.create(
            project=p1,
            assigned_employee=employees[1], # Backend
            role_type='BACKEND',
            title="Django REST API & WebSocket Feed Setup",
            description="Configure Django REST viewsets, payment calculations, and real-time transaction logger.",
            payout=1800.00,
            status="COMPLETED",
            due_date=(timezone.now() + timedelta(days=5)).date()
        )

        t3 = Task.objects.create(
            project=p1,
            assigned_employee=employees[2], # UI/UX
            role_type='UIUX',
            title="Design Modern Glassmorphism & Light Theme System",
            description="Design Lusion & Codrops inspired light theme color tokens, dynamic cards, and micro-interactions.",
            payout=1100.00,
            status="COMPLETED",
            due_date=(timezone.now() + timedelta(days=3)).date()
        )

        # Completed Project Tasks
        t4 = Task.objects.create(
            project=p2,
            assigned_employee=employees[3], # Fullstack
            role_type='FULLSTACK',
            title="Full Architecture & 3D Model Loader Integration",
            description="Integrated glTF 3D model loaders with Drei canvas shadows and GSAP scroll triggers.",
            payout=2000.00,
            status="COMPLETED",
            due_date=(timezone.now() - timedelta(days=5)).date()
        )

        # 6. Deliverables with Video Demos uploaded by developers
        Deliverable.objects.create(
            task=t2,
            project=p1,
            uploaded_by=employees[1],
            title="Django Core REST APIs & Database Schemas v1.0",
            code_url="https://github.com/agency/horizon-backend",
            video_demo_url="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-screens-of-a-data-center-40010-large.mp4",
            status="APPROVED",
            feedback="Great work Sarah! Clean code and fast response time."
        )

        Deliverable.objects.create(
            task=t4,
            project=p2,
            uploaded_by=employees[3],
            title="Final 3D Lusion Portal Build & Video Proof",
            code_url="https://github.com/agency/acme-3d-portal",
            video_demo_url="https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-hud-display-42875-large.mp4",
            status="APPROVED",
            feedback="Outstanding 3D motion. Client approved final delivery!"
        )

        # 7. Chat Messages
        ChatMessage.objects.create(
            project=p1,
            sender=owner_user,
            sender_name="Admin (Aura Studio)",
            sender_role="OWNER",
            message="Welcome Lisa! We have assigned Sarah (Backend) and Alex (Frontend) to your Liquidity Dashboard project."
        )

        ChatMessage.objects.create(
            project=p1,
            sender=client2,
            sender_name="Lisa Ray",
            sender_role="CLIENT",
            message="Thanks Admin! Can we make sure the 3D particle nodes render cleanly on mobile devices?"
        )

        ChatMessage.objects.create(
            project=p1,
            sender=employees[0],
            sender_name="Alex Rivera (Frontend)",
            sender_role="EMPLOYEE",
            message="Hi Lisa! Absolutely, I am optimizing the R3F buffer geometries for 60fps performance across mobile GPUs."
        )

        # 8. Payments
        Payment.objects.create(
            project=p1,
            client=client2,
            amount=2160.00,
            payment_type='ADVANCE_30',
            transaction_id='TXN-ADV-998822',
            status='SUCCESS'
        )

        Payment.objects.create(
            project=p2,
            client=client_user,
            amount=1049.70,
            payment_type='ADVANCE_30',
            transaction_id='TXN-ADV-112233',
            status='SUCCESS'
        )

        Payment.objects.create(
            project=p2,
            client=client_user,
            amount=2449.30,
            payment_type='FINAL_70',
            transaction_id='TXN-FNL-445566',
            status='SUCCESS'
        )

        # 9. Audit Logs
        AuditLog.objects.create(user=owner_user, action="System Seeded", details="Database populated with 50+ templates and sample active projects.")
        AuditLog.objects.create(user=client_user, action="Advance Deposit Paid", details="Paid $1049.70 for Acme Lusion 3D Brand Portal.")
        AuditLog.objects.create(user=owner_user, action="Final Approval Granted", details="Owner verified video deliverables and released final payouts.")

        # 10. Login History (powers the expandable admin user/developer log console)
        LoginHistory.objects.all().delete()
        now = timezone.now()
        for u in [owner_user, client_user, client2] + employees:
            role = u.profile.role
            sessions = random.randint(3, 12)
            for i in range(sessions):
                LoginHistory.objects.create(
                    user=u,
                    role=role,
                    ip_address=f"10.0.{random.randint(0, 24)}.{random.randint(2, 250)}",
                    user_agent=random.choice([
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/128.0',
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148 Safari/604.1',
                    ]),
                    login_time=now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59)),
                )

        # 11. Resume records for developers (admin uploadable / re-uploadable)
        Resume.objects.all().delete()
        for u in employees:
            Resume.objects.create(
                user=u,
                external_url=f"https://cdn.aurastudio.dev/resumes/{u.username}-v1.pdf",
                original_name=f"{u.username}-resume.pdf",
                version=1,
                is_current=True,
                notes='Imported during onboarding',
                uploaded_by=owner_user,
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
