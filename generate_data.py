import json
import csv
import random
import math

# Set fixed seed for reproducibility
random.seed(42)

BUSINESS_TEMPLATES = [
    ("Artisan Bakery", "Bakery & Food", "Purchasing a commercial convection oven to double daily artisan sourdough production."),
    ("Eco-Cycle Courier", "Logistics & Transport", "Upgrading cargo e-bike fleet for same-day zero-emission local parcel deliveries."),
    ("Urban Hydroponics", "Agriculture & Farming", "Installing vertical LED grow towers to supply fresh microgreens to local restaurants."),
    ("Solstice Coffee Roastery", "Retail & Hospitality", "Financing direct-trade green coffee bean bulk shipment from certified cooperatives."),
    ("Apex Custom Carpentry", "Manufacturing & Trades", "Acquiring precision CNC wood router to fulfill commercial retail interior contracts."),
    ("HealthBridge Mobile Clinic", "Healthcare & Wellness", "Procuring diagnostic ultrasound gear for community mobile outreach visits."),
    ("NextWave Coding Academy", "Education & EdTech", "Purchasing refurbished high-spec laptops for subsidized vocational bootcamp students."),
    ("Loom & Dye Textiles", "Artisan Crafts", "Restocking sustainable organic cotton yarns and non-toxic natural indigo dyes."),
    ("QuickFix Solar Installations", "Clean Energy", "Stocking photovoltaic inverters and safety rigging for residential rooftop installs."),
    ("FreshRoots Farmers Market", "Agriculture & Farming", "Acquiring a refrigerated display trailer for weekend regional farmers markets."),
    ("ByteSafe Cybersecurity", "Professional Services", "Licensing cloud security assessment tooling for small-business audit retainers."),
    ("Paws & Claws Veterinary Care", "Healthcare & Wellness", "Purchasing digital dental X-ray scanner for preventative pet surgical care."),
    ("TerraCraft Pottery Studio", "Artisan Crafts", "Installing high-efficiency electric ceramic kilns to handle increased workshop demand."),
    ("VoltCharge EV Maintenance", "Automotive & Trades", "Specialized high-voltage diagnostic tools for independent electric vehicle servicing."),
    ("Harbor View Seafood Bistro", "Retail & Hospitality", "Upgrading energy-efficient commercial walk-in freezer before summer peak season."),
    ("KiddieCraft Early Learning", "Education & Childcare", "Renovating outdoor Montessori play area with child-safe sustainable timber."),
    ("CleanStream Greywater Tech", "Clean Energy", "Manufacturing prototype domestic water recycling filter kits for municipal pilot."),
    ("SoundStage Audio Production", "Creative & Media", "Upgrading acoustic mastering studio monitors and licensing spatial audio suite."),
    ("Summit Athletic Apparel", "Retail & Apparel", "Initial batch manufacturing run for recycled ocean-plastic moisture-wicking activewear."),
    ("Zenith Drone Surveying", "Tech & Logistics", "Acquiring LiDAR sensor payload for agricultural topography and construction mapping."),
    ("Golden Crust Pizza Co.", "Bakery & Food", "Purchasing mobile wood-fired pizza trailer for corporate events and festivals."),
    ("Prism Print & Design", "Creative & Media", "Investing in wide-format eco-solvent banner printer to fulfill local trade show orders."),
    ("BlueSky Home Health", "Healthcare & Wellness", "Working capital to hire and equip certified nursing assistants for elderly in-home care."),
    ("Apex Drone Repair Lab", "Automotive & Trades", "Precision micro-soldering station and parts inventory for commercial drone repairs."),
    ("Heritage Leather Goods", "Artisan Crafts", "Purchasing industrial heavy-duty leather stitcher for handcrafted durable bags."),
    ("ClearSky Window Cleaning", "Professional Services", "Commercial water-fed pole purification system for multi-story office facades."),
    ("GreenThumb Nursery & Landscaping", "Agriculture & Farming", "Expanding heated glasshouse nursery capacity for winter heirloom seedlings."),
    ("Precision Tool & Die", "Manufacturing & Trades", "Replacing worn lathe spindle and expanding inventory of carbide cutting inserts."),
    ("Beacon Language Institute", "Education & EdTech", "Developing interactive conversational mobile learning module for immigrant workers."),
    ("TrueBrew Kombucha Lab", "Bakery & Food", "Procuring automated canning line and stainless fermentation tanks to scale distro.")
]

OWNER_FIRST_NAMES = [
    "Elena", "Marcus", "Amina", "Liam", "Sophia", "Mateo", "Priya", "Chen",
    "Fatima", "Lucas", "Maya", "Tariq", "Chloe", "Arjun", "Isabella", "Devon",
    "Zoe", "Dante", "Nadia", "Kofi", "Hannah", "Gabriel", "Siti", "Oscar",
    "Leila", "Dmitri", "Amara", "Carlos", "Kenji", "Aaliyah", "Elijah", "Sunita"
]

OWNER_LAST_NAMES = [
    "Vance", "Chen", "Al-Mansoor", "O'Connor", "Silva", "Gupta", "Morales", "Tanaka",
    "Diallo", "Jensen", "Kowalski", "Adeyemi", "Petrov", "Reyes", "Nakamura", "Becker",
    "Fontaine", "Larsson", "Dubois", "Haddad", "Patel", "Novak", "Mensah", "Santos",
    "Kim", "Lindqvist", "Mendoza", "Okafor", "Svensson", "Gomez", "Sharma", "Bauer"
]

def generate_listings(n=200):
    listings = []

    # Distribution of credit grades to represent a realistic P2P marketplace
    # Grade A: 20%, Grade B: 30%, Grade C: 25%, Grade D: 15%, Grade E: 10%
    grade_distribution = (
        ["A"] * int(n * 0.20) +
        ["B"] * int(n * 0.30) +
        ["C"] * int(n * 0.25) +
        ["D"] * int(n * 0.15) +
        ["E"] * int(n * 0.10)
    )
    # Fill remaining to match n
    while len(grade_distribution) < n:
        grade_distribution.append("B")
    random.shuffle(grade_distribution)

    for i in range(n):
        loan_id = f"LN-{1000 + i + 1}"
        grade = grade_distribution[i]
        template = random.choice(BUSINESS_TEMPLATES)
        first_name = random.choice(OWNER_FIRST_NAMES)
        last_name = random.choice(OWNER_LAST_NAMES)
        borrower_name = f"{first_name} {last_name}"
        business_title = f"{first_name}'s {template[0]}"

        # Calibrated metrics per grade
        if grade == "A":
            credit_score = random.randint(750, 830)
            base_apr = random.uniform(6.5, 9.8)
            dti = round(random.uniform(0.08, 0.24), 2)
            prior_defaults = 0
            emp_years = round(random.uniform(4.0, 15.0), 1)
            monthly_income = random.randint(4500, 12000)
            loan_amount = random.choice([2500, 3500, 5000, 7500, 10000, 12000, 15000, 20000])
            term_months = random.choice([12, 18, 24, 36])
            base_pd = random.uniform(0.012, 0.035)  # 1.2% - 3.5%
        elif grade == "B":
            credit_score = random.randint(700, 749)
            base_apr = random.uniform(10.0, 14.5)
            dti = round(random.uniform(0.18, 0.32), 2)
            prior_defaults = 0 if random.random() > 0.1 else 1
            emp_years = round(random.uniform(2.5, 10.0), 1)
            monthly_income = random.randint(3200, 8500)
            loan_amount = random.choice([1500, 2500, 4000, 6000, 8000, 10000, 14000])
            term_months = random.choice([12, 18, 24, 36])
            base_pd = random.uniform(0.038, 0.075)  # 3.8% - 7.5%
        elif grade == "C":
            credit_score = random.randint(650, 699)
            base_apr = random.uniform(14.8, 19.5)
            dti = round(random.uniform(0.25, 0.40), 2)
            prior_defaults = random.choice([0, 0, 1])
            emp_years = round(random.uniform(1.5, 7.0), 1)
            monthly_income = random.randint(2400, 6500)
            loan_amount = random.choice([1000, 2000, 3000, 5000, 7500, 9000, 12000])
            term_months = random.choice([6, 12, 18, 24])
            base_pd = random.uniform(0.080, 0.135)  # 8.0% - 13.5%
        elif grade == "D":
            credit_score = random.randint(600, 649)
            base_apr = random.uniform(19.8, 26.5)
            dti = round(random.uniform(0.32, 0.48), 2)
            prior_defaults = random.choice([0, 1, 1, 2])
            emp_years = round(random.uniform(1.0, 5.0), 1)
            monthly_income = random.randint(1800, 4800)
            loan_amount = random.choice([800, 1500, 2500, 4000, 5500, 7000])
            term_months = random.choice([6, 12, 18])
            base_pd = random.uniform(0.140, 0.220)  # 14.0% - 22.0%
        else: # Grade E
            credit_score = random.randint(550, 599)
            base_apr = random.uniform(27.0, 34.5)
            dti = round(random.uniform(0.38, 0.55), 2)
            prior_defaults = random.choice([1, 1, 2])
            emp_years = round(random.uniform(0.5, 3.5), 1)
            monthly_income = random.randint(1400, 3600)
            loan_amount = random.choice([500, 1000, 1800, 2500, 3500])
            term_months = random.choice([6, 12, 18])
            base_pd = random.uniform(0.225, 0.340)  # 22.5% - 34.0%

        # Actuarially calibrated Probability of Default (PD) adjustments
        # Adjust with DTI and prior defaults
        pd_adjusted = base_pd * (1.0 + (dti - 0.25) * 0.5 + prior_defaults * 0.2)
        pd_adjusted = max(0.01, min(0.40, pd_adjusted))
        repayment_likelihood = round((1.0 - pd_adjusted) * 100, 2)
        pd_pct = round(pd_adjusted * 100, 2)
        apr = round(base_apr, 2)

        # Standard unsecured micro-loan Loss Given Default (LGD) ~ 75%
        # Slightly lower if short tenor or high income-to-loan ratio
        lgd_pct = round(random.uniform(68.0, 82.0), 1)
        lgd_factor = lgd_pct / 100.0

        # Expected Net ROI: E[ROI] = (1 - PD) * APR - (PD * LGD)
        expected_net_roi = round(((1.0 - pd_adjusted) * apr) - (pd_adjusted * lgd_pct), 2)

        # Monthly payment calculation: standard amortized annuity
        monthly_rate = (apr / 100.0) / 12.0
        monthly_payment = round(
            loan_amount * (monthly_rate * (1 + monthly_rate)**term_months) / ((1 + monthly_rate)**term_months - 1),
            2
        )

        listing = {
            "loan_id": loan_id,
            "borrower_name": borrower_name,
            "business_title": business_title,
            "category": template[1],
            "description": template[2],
            "loan_amount": loan_amount,
            "interest_rate_apr": apr,
            "term_months": term_months,
            "monthly_payment": monthly_payment,
            "credit_score": credit_score,
            "credit_grade": grade,
            "repayment_likelihood_pct": repayment_likelihood,
            "default_probability_pct": pd_pct,
            "debt_to_income_ratio": dti,
            "monthly_income": monthly_income,
            "employment_history_years": emp_years,
            "prior_defaults": prior_defaults,
            "loss_given_default_pct": lgd_pct,
            "expected_net_roi_pct": expected_net_roi,
            "funding_status": "open",
            "funded_amount": 0,
            "funding_progress_pct": 0.0
        }
        listings.append(listing)

    return listings

def main():
    listings = generate_listings(200)

    # Save to JSON
    json_path = "borrower_listings.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(listings, f, indent=2)

    # Save to CSV
    csv_path = "borrower_listings.csv"
    fieldnames = list(listings[0].keys())
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(listings)

    print(f"Successfully generated {len(listings)} realistic borrower listings!")
    print(f"Files written: {json_path} and {csv_path}")

    # Summary statistics
    grades = {}
    for l in listings:
        g = l["credit_grade"]
        grades[g] = grades.get(g, 0) + 1

    print("\nCredit Grade Breakdown:")
    for g, count in sorted(grades.items()):
        avg_apr = sum(l["interest_rate_apr"] for l in listings if l["credit_grade"] == g) / count
        avg_repay = sum(l["repayment_likelihood_pct"] for l in listings if l["credit_grade"] == g) / count
        avg_net_roi = sum(l["expected_net_roi_pct"] for l in listings if l["credit_grade"] == g) / count
        print(f"  Grade {g}: {count:2d} loans | Avg APR: {avg_apr:5.2f}% | Repayment Prob: {avg_repay:5.2f}% | Expected Net ROI: {avg_net_roi:5.2f}%")

if __name__ == "__main__":
    main()
