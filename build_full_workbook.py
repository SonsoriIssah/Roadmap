# -*- coding: utf-8 -*-
"""
Generator script for 2027_software_engineering_recruiting_tracker.xlsx
Generates a complete, professional, 4-sheet Excel workbook.
"""

import sys
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.chart import BarChart, Reference

from companies_data import COMPANIES_DATA

def build_recruiting_tracker():
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # -------------------------------------------------------------
    # STYLES & PALETTE
    # -------------------------------------------------------------
    font_family = "Segoe UI"
    
    # Fonts
    title_font = Font(name=font_family, size=16, bold=True, color="1E293B")
    subtitle_font = Font(name=font_family, size=10, italic=True, color="64748B")
    meta_font = Font(name=font_family, size=9, bold=True, color="475569")
    header_font = Font(name=font_family, size=10, bold=True, color="FFFFFF")
    data_font = Font(name=font_family, size=9, color="1E293B")
    bold_data_font = Font(name=font_family, size=9, bold=True, color="1E293B")
    url_font = Font(name=font_family, size=9, color="0284C7", underline="single")
    
    # Fills
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid") # Navy Blue
    header_alt_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid") # Dark Slate
    banner_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    
    # Priority fills
    prio_a_fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid") # Soft Blue
    prio_b_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid") # Light Slate
    
    # Zebra fills
    zebra_even = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    zebra_odd = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    
    # Borders
    thin_border_side = Side(border_style="thin", color="E2E8F0")
    data_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    header_border = Border(
        left=Side(border_style="thin", color="334155"),
        right=Side(border_style="thin", color="334155"),
        top=Side(border_style="medium", color="0F172A"),
        bottom=Side(border_style="medium", color="0F172A")
    )
    
    # Alignments
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # -------------------------------------------------------------
    # MASTER TRACKER COLUMN DEFINITIONS
    # -------------------------------------------------------------
    columns = [
        ("Company ID", 12, align_center),
        ("Company", 22, align_left),
        ("Region", 20, align_center),
        ("Priority", 10, align_center),
        ("Internship Role", 34, align_left),
        ("2027 Application Opening Date", 18, align_center),
        ("Application Deadline", 22, align_center),
        ("Application Type (Rolling / Fixed Deadline / Unknown)", 20, align_center),
        ("Target Country", 22, align_left),
        ("Target Office or City", 24, align_left),
        ("International Student Eligibility", 26, align_center),
        ("Visa Sponsorship", 25, align_center),
        ("Graduation-Year Requirements", 32, align_left),
        ("Official Careers URL", 28, align_left),
        ("Exact Internship Posting URL", 30, align_left),
        ("Job Alert Method", 32, align_left),
        ("Referral Contact", 20, align_left),
        ("Contact Profile URL", 22, align_left),
        ("Application Status", 18, align_center),
        ("Date Applied", 14, align_center),
        ("Assessment Status", 16, align_center),
        ("Interview Stage", 22, align_center),
        ("Last Checked Date", 15, align_center),
        ("Next Follow-Up Date", 16, align_center),
        ("Research Notes", 48, align_left)
    ]

    # Researched companies with verified facts as of Oct 2026
    verified_companies = {
        "Goldman Sachs", "JPMorgan Chase", "Bloomberg", "Bank of America", "Morgan Stanley",
        "Citi", "Palantir", "Microsoft", "Google", "Amazon", "Meta", "NVIDIA", "Apple",
        "Databricks", "Stripe", "Two Sigma", "Jane Street", "Capital One", "Uber",
        "Cloudflare", "Hudson River Trading", "Revolut", "Wise", "Monzo", "Starling Bank",
        "Adyen", "Spotify", "Booking.com", "Canonical", "Arm", "SAP", "Delivery Hero",
        "Celonis", "Optiver", "IMC Trading", "Flow Traders", "Susquehanna International Group (SIG)",
        "Grab", "Sea Limited (Shopee)", "ByteDance", "Samsung Electronics", "Rakuten",
        "Mercari", "Sony", "PayPay", "Agoda", "GovTech Singapore", "DBS Bank", "OCBC", "UOB"
    }

    # =============================================================
    # SHEET 1: MASTER TRACKER
    # =============================================================
    ws_master = wb.create_sheet(title="Master Tracker")
    ws_master.views.sheetView[0].showGridLines = True

    # Title block
    ws_master["A1"] = "2027 SOFTWARE ENGINEERING INTERNSHIP MASTER RECRUITING TRACKER"
    ws_master["A1"].font = title_font
    ws_master["A2"] = "Target Focus: Backend Services, Distributed Systems, Cloud Infrastructure & Systems Software"
    ws_master["A2"].font = subtitle_font
    ws_master["A3"] = "Candidate: Kwame Nkrumah University of Science & Technology (KNUST), Ghana | International Applicant Scope: North America, Europe, Asia"
    ws_master["A3"].font = meta_font
    
    # Headers
    header_row = 5
    for col_idx, (col_name, col_width, col_align) in enumerate(columns, start=1):
        cell = ws_master.cell(row=header_row, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = header_border
        col_letter = get_column_letter(col_idx)
        ws_master.column_dimensions[col_letter].width = col_width

    ws_master.row_dimensions[header_row].height = 36
    ws_master.row_dimensions[1].height = 24
    ws_master.row_dimensions[2].height = 18
    ws_master.row_dimensions[3].height = 18

    # Populate Data
    start_row = 6
    for i, comp in enumerate(COMPANIES_DATA):
        row_idx = start_row + i
        ws_master.row_dimensions[row_idx].height = 28
        
        is_even = (i % 2 == 0)
        row_fill = zebra_even if is_even else zebra_odd
        
        last_checked = "10 Oct 2026" if comp["name"] in verified_companies else ""
        next_followup = comp["opening_date"] if comp["opening_date"] != "Open Year-Round" else "15 Oct 2026"
        
        row_values = [
            comp["id"],
            comp["name"],
            comp["region"],
            comp["priority"],
            comp["role"],
            comp["opening_date"],
            comp["deadline"],
            comp["app_type"],
            comp["country"],
            comp["city"],
            comp["eligibility"],
            comp["sponsorship"],
            comp["grad_req"],
            comp["careers_url"],
            comp["posting_url"],
            comp["alert_method"],
            "", # Referral Contact
            "", # Contact Profile URL
            "Not checked", # Initial status
            "", # Date Applied
            "None", # Assessment Status
            "None", # Interview Stage
            last_checked,
            next_followup,
            comp["notes"]
        ]

        for col_idx, val in enumerate(row_values, start=1):
            cell = ws_master.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.fill = row_fill
            cell.border = data_border
            cell.alignment = columns[col_idx-1][2]
            
            # Format URLs as clickable links
            if col_idx in (14, 15) and val.startswith("http"):
                cell.hyperlink = val
                cell.font = url_font
            
            # Highlight Priority
            if col_idx == 4:
                cell.font = bold_data_font
                cell.fill = prio_a_fill if val == "A" else prio_b_fill
                
            # Bold Company Name
            if col_idx == 2:
                cell.font = bold_data_font

    end_row_master = start_row + len(COMPANIES_DATA) - 1

    # Excel Table
    master_table = Table(displayName="MasterTrackerTable", ref=f"A{header_row}:Y{end_row_master}")
    master_table.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium9",
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False
    )
    ws_master.add_table(master_table)
    
    # Freeze panes at Row 6, Column C (pins header & Company ID/Name)
    ws_master.freeze_panes = "C6"

    # =============================================================
    # DATA VALIDATION FOR MASTER TRACKER
    # =============================================================
    # Priority
    dv_prio = DataValidation(type="list", formula1='"A,B"', allow_blank=True)
    ws_master.add_data_validation(dv_prio)
    dv_prio.add(f"D{start_row}:D{end_row_master}")

    # Application Type
    dv_type = DataValidation(type="list", formula1='"Rolling,Fixed Deadline,Unknown"', allow_blank=True)
    ws_master.add_data_validation(dv_type)
    dv_type.add(f"H{start_row}:H{end_row_master}")

    # Eligibility
    elig_options = '"Confirmed eligible,Potentially eligible; verify requirements,Not eligible based on stated requirements,Requires existing work authorization,Research required"'
    dv_elig = DataValidation(type="list", formula1=elig_options, allow_blank=True)
    ws_master.add_data_validation(dv_elig)
    dv_elig.add(f"K{start_row}:K{end_row_master}")

    # Sponsorship
    spons_options = '"Sponsorship explicitly offered,Sponsorship explicitly unavailable,Existing work authorization required,Not stated; research required,Role-specific; verify"'
    dv_spons = DataValidation(type="list", formula1=spons_options, allow_blank=True)
    ws_master.add_data_validation(dv_spons)
    dv_spons.add(f"L{start_row}:L{end_row_master}")

    # Application Status
    status_options = '"Not checked,Researching,Not yet open,Open - preparing application,Ready to apply,Applied,Assessment pending,Interviewing,Offer received,Rejected,Withdrawn,Closed"'
    dv_status = DataValidation(type="list", formula1=status_options, allow_blank=True)
    ws_master.add_data_validation(dv_status)
    dv_status.add(f"S{start_row}:S{end_row_master}")

    # Assessment Status
    assess_options = '"None,Received,In progress,Completed,Passed,Failed,Expired"'
    dv_assess = DataValidation(type="list", formula1=assess_options, allow_blank=True)
    ws_master.add_data_validation(dv_assess)
    dv_assess.add(f"U{start_row}:U{end_row_master}")

    # Interview Stage
    stage_options = '"None,Recruiter Screen,Technical Phone Screen 1,Technical Phone Screen 2,Take-Home Project,Final Round / Onsite,Team Match,Awaiting Decision"'
    dv_stage = DataValidation(type="list", formula1=stage_options, allow_blank=True)
    ws_master.add_data_validation(dv_stage)
    dv_stage.add(f"V{start_row}:V{end_row_master}")

    # =============================================================
    # CONDITIONAL FORMATTING (MASTER TRACKER)
    # =============================================================
    status_col_letter = "S"
    
    # Status rules
    rule_not_checked = CellIsRule(operator='equal', formula=['"Not checked"'], 
                                  fill=PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid"),
                                  font=Font(name=font_family, size=9, color="475569"))
    rule_applied = CellIsRule(operator='equal', formula=['"Applied"'], 
                              fill=PatternFill(start_color="E0F2FE", end_color="E0F2FE", fill_type="solid"),
                              font=Font(name=font_family, size=9, bold=True, color="0369A1"))
    rule_interviewing = CellIsRule(operator='equal', formula=['"Interviewing"'], 
                                   fill=PatternFill(start_color="F3E8FF", end_color="F3E8FF", fill_type="solid"),
                                   font=Font(name=font_family, size=9, bold=True, color="7E22CE"))
    rule_offer = CellIsRule(operator='equal', formula=['"Offer received"'], 
                            fill=PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid"),
                            font=Font(name=font_family, size=9, bold=True, color="15803D"))
    rule_rejected = CellIsRule(operator='equal', formula=['"Rejected"'], 
                               fill=PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid"),
                               font=Font(name=font_family, size=9, color="B91C1C"))
    
    for r in [rule_not_checked, rule_applied, rule_interviewing, rule_offer, rule_rejected]:
        ws_master.conditional_formatting.add(f"S{start_row}:S{end_row_master}", r)

    # Priority A Highlight
    rule_prio_a = CellIsRule(operator='equal', formula=['"A"'],
                             fill=PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid"),
                             font=Font(name=font_family, size=9, bold=True, color="1D4ED8"))
    ws_master.conditional_formatting.add(f"D{start_row}:D{end_row_master}", rule_prio_a)

    # Unknown / Research required highlight (soft amber/slate)
    rule_unknown_elig = CellIsRule(operator='equal', formula=['"Research required"'],
                                   fill=PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid"),
                                   font=Font(name=font_family, size=9, color="92400E"))
    ws_master.conditional_formatting.add(f"K{start_row}:K{end_row_master}", rule_unknown_elig)

    # =============================================================
    # SHEET 2: FILTERED VIEW (Priority A & Status = Not checked)
    # =============================================================
    ws_filtered = wb.create_sheet(title="Filtered View")
    ws_filtered.views.sheetView[0].showGridLines = True

    # Filtered View Title Block
    ws_filtered["A1"] = "2027 SWE INTERNSHIP TARGET QUEUE - PRIORITY A COMPANIES"
    ws_filtered["A1"].font = title_font
    ws_filtered["A2"] = "Active Pre-Filter: Region: ALL | Priority: A | Application Status: Not checked"
    ws_filtered["A2"].font = subtitle_font
    ws_filtered["A3"] = "Tier-1 High Relevance Target Queue: Distributed Systems, Cloud Infrastructure & Quant Systems"
    ws_filtered["A3"].font = meta_font

    ws_filtered.row_dimensions[1].height = 24
    ws_filtered.row_dimensions[2].height = 18
    ws_filtered.row_dimensions[3].height = 18
    ws_filtered.row_dimensions[5].height = 36

    # Headers for Filtered View
    header_fill_filtered = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid") # Deep Teal
    for col_idx, (col_name, col_width, col_align) in enumerate(columns, start=1):
        cell = ws_filtered.cell(row=5, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill_filtered
        cell.alignment = header_align
        cell.border = header_border
        col_letter = get_column_letter(col_idx)
        ws_filtered.column_dimensions[col_letter].width = col_width

    # Filter Priority A companies
    filtered_data = [comp for comp in COMPANIES_DATA if comp["priority"] == "A"]
    start_row_filtered = 6
    
    for i, comp in enumerate(filtered_data):
        row_idx = start_row_filtered + i
        ws_filtered.row_dimensions[row_idx].height = 28
        is_even = (i % 2 == 0)
        row_fill = zebra_even if is_even else zebra_odd
        
        last_checked = "10 Oct 2026" if comp["name"] in verified_companies else ""
        next_followup = comp["opening_date"] if comp["opening_date"] != "Open Year-Round" else "15 Oct 2026"
        
        row_values = [
            comp["id"],
            comp["name"],
            comp["region"],
            comp["priority"],
            comp["role"],
            comp["opening_date"],
            comp["deadline"],
            comp["app_type"],
            comp["country"],
            comp["city"],
            comp["eligibility"],
            comp["sponsorship"],
            comp["grad_req"],
            comp["careers_url"],
            comp["posting_url"],
            comp["alert_method"],
            "",
            "",
            "Not checked",
            "",
            "None",
            "None",
            last_checked,
            next_followup,
            comp["notes"]
        ]

        for col_idx, val in enumerate(row_values, start=1):
            cell = ws_filtered.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.fill = row_fill
            cell.border = data_border
            cell.alignment = columns[col_idx-1][2]
            
            if col_idx in (14, 15) and val.startswith("http"):
                cell.hyperlink = val
                cell.font = url_font
            if col_idx == 4:
                cell.font = bold_data_font
                cell.fill = prio_a_fill
            if col_idx == 2:
                cell.font = bold_data_font

    end_row_filtered = start_row_filtered + len(filtered_data) - 1

    # Excel Table for Filtered View
    filtered_table = Table(displayName="FilteredTrackerTable", ref=f"A5:Y{end_row_filtered}")
    filtered_table.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium2",
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False
    )
    ws_filtered.add_table(filtered_table)
    ws_filtered.freeze_panes = "C6"

    # Add validations to Filtered View as well
    ws_filtered.add_data_validation(dv_prio)
    dv_prio.add(f"D{start_row_filtered}:D{end_row_filtered}")
    ws_filtered.add_data_validation(dv_status)
    dv_status.add(f"S{start_row_filtered}:S{end_row_filtered}")
    ws_filtered.add_data_validation(dv_elig)
    dv_elig.add(f"K{start_row_filtered}:K{end_row_filtered}")
    ws_filtered.add_data_validation(dv_spons)
    dv_spons.add(f"L{start_row_filtered}:L{end_row_filtered}")

    # =============================================================
    # SHEET 3: DASHBOARD
    # =============================================================
    ws_dash = wb.create_sheet(title="Dashboard")
    ws_dash.views.sheetView[0].showGridLines = True

    # Title Banner
    ws_dash["A1"] = "2027 SOFTWARE ENGINEERING RECRUITING EXECUTIVE DASHBOARD"
    ws_dash["A1"].font = Font(name=font_family, size=16, bold=True, color="1E3A8A")
    ws_dash["A2"] = "Live Key Performance Indicators, Pipeline Velocity & Global Opportunity Metrics"
    ws_dash["A2"].font = subtitle_font
    ws_dash["A3"] = "Target: Backend & Distributed Systems | Candidate: KNUST Ghana | All metrics dynamically calculate from 'Master Tracker'"
    ws_dash["A3"].font = meta_font

    ws_dash.row_dimensions[1].height = 24
    ws_dash.row_dimensions[2].height = 18
    ws_dash.row_dimensions[3].height = 18

    # KPI Layout
    # Card Styles
    kpi_title_font = Font(name=font_family, size=9, bold=True, color="475569")
    kpi_num_font = Font(name=font_family, size=20, bold=True, color="0F172A")
    kpi_sub_font = Font(name=font_family, size=8, italic=True, color="64748B")
    
    kpi_card_border = Border(
        left=Side(border_style="thin", color="CBD5E1"),
        right=Side(border_style="thin", color="CBD5E1"),
        top=Side(border_style="medium", color="2563EB"),
        bottom=Side(border_style="thin", color="CBD5E1")
    )
    
    kpi_warn_border = Border(
        left=Side(border_style="thin", color="CBD5E1"),
        right=Side(border_style="thin", color="CBD5E1"),
        top=Side(border_style="medium", color="D97706"),
        bottom=Side(border_style="thin", color="CBD5E1")
    )
    
    kpi_success_border = Border(
        left=Side(border_style="thin", color="CBD5E1"),
        right=Side(border_style="thin", color="CBD5E1"),
        top=Side(border_style="medium", color="16A34A"),
        bottom=Side(border_style="thin", color="CBD5E1")
    )

    kpi_danger_border = Border(
        left=Side(border_style="thin", color="CBD5E1"),
        right=Side(border_style="thin", color="CBD5E1"),
        top=Side(border_style="medium", color="DC2626"),
        bottom=Side(border_style="thin", color="CBD5E1")
    )

    kpi_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

    # Helper function to render a KPI card
    def render_kpi_card(ws, top_left_cell, bottom_right_cell, title, formula_val, subtitle, border_style):
        # We merge or format the box
        start_c = top_left_cell[0]
        start_r = int(top_left_cell[1:])
        ws[top_left_cell] = title
        ws[top_left_cell].font = kpi_title_font
        ws[top_left_cell].alignment = Alignment(horizontal="center", vertical="center")
        
        num_cell = f"{start_c}{start_r+1}"
        ws[num_cell] = formula_val
        ws[num_cell].font = kpi_num_font
        ws[num_cell].alignment = Alignment(horizontal="center", vertical="center")
        
        sub_cell = f"{start_c}{start_r+2}"
        ws[sub_cell] = subtitle
        ws[sub_cell].font = kpi_sub_font
        ws[sub_cell].alignment = Alignment(horizontal="center", vertical="center")
        
        # Apply borders & fills to the card cells
        for r in range(start_r, start_r + 3):
            cell = ws[f"{start_c}{r}"]
            cell.fill = kpi_fill
            cell.border = border_style

    # Row 1 of KPIs (Row 5 to 7): Portfolio Overview
    render_kpi_card(ws_dash, "B5", "B7", "TOTAL TARGET COMPANIES", f"=COUNTA('Master Tracker'!B{start_row}:B{end_row_master})", "100% database coverage", kpi_card_border)
    render_kpi_card(ws_dash, "D5", "D7", "PRIORITY A COMPANIES", f"=COUNTIF('Master Tracker'!D{start_row}:D{end_row_master}, \"A\")", "Tier-1 top priority targets", kpi_card_border)
    render_kpi_card(ws_dash, "F5", "F7", "PRIORITY B COMPANIES", f"=COUNTIF('Master Tracker'!D{start_row}:D{end_row_master}, \"B\")", "Secondary target wave", kpi_card_border)
    render_kpi_card(ws_dash, "H5", "H7", "APPLICATIONS NOT CHECKED", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Not checked\")", "Pending initial review", kpi_warn_border)
    render_kpi_card(ws_dash, "J5", "J7", "OPEN APPLICATIONS", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Open - preparing application\") + COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Ready to apply\")", "Active & ready to apply", kpi_success_border)

    # Row 2 of KPIs (Row 9 to 11): Pipeline Velocity
    render_kpi_card(ws_dash, "B9", "B11", "APPLICATIONS SUBMITTED", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Applied\")", "Submitted candidate dossiers", kpi_card_border)
    render_kpi_card(ws_dash, "D9", "D11", "ONLINE ASSESSMENTS PENDING", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Assessment pending\") + COUNTIF('Master Tracker'!U{start_row}:U{end_row_master}, \"Received\") + COUNTIF('Master Tracker'!U{start_row}:U{end_row_master}, \"In progress\")", "HackerRank / CodeSignal pending", kpi_warn_border)
    render_kpi_card(ws_dash, "F9", "F11", "INTERVIEWS IN PROGRESS", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Interviewing\")", "Active technical rounds", kpi_success_border)
    render_kpi_card(ws_dash, "H9", "H11", "OFFERS RECEIVED", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Offer received\")", "Target summer 2027 offers", kpi_success_border)
    render_kpi_card(ws_dash, "J9", "J11", "REJECTIONS / CLOSED", f"=COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Rejected\") + COUNTIF('Master Tracker'!S{start_row}:S{end_row_master}, \"Closed\")", "Data points for iteration", kpi_danger_border)

    # Row 3 of KPIs (Row 13 to 15): Eligibility & Deadlines
    render_kpi_card(ws_dash, "B13", "B15", "UNKNOWN ELIGIBILITY", f"=COUNTIF('Master Tracker'!K{start_row}:K{end_row_master}, \"Research required\")", "Requires KNUST status check", kpi_warn_border)
    render_kpi_card(ws_dash, "D13", "D15", "UNKNOWN VISA SPONSORSHIP", f"=COUNTIF('Master Tracker'!L{start_row}:L{end_row_master}, \"Not stated; research required\") + COUNTIF('Master Tracker'!L{start_row}:L{end_row_master}, \"Research required\")", "Visa policy unconfirmed", kpi_warn_border)
    render_kpi_card(ws_dash, "F13", "F15", "DEADLINES WITHIN 7 DAYS", f"=COUNTIFS('Master Tracker'!G{start_row}:G{end_row_master}, \"<=\"&TODAY()+7, 'Master Tracker'!G{start_row}:G{end_row_master}, \">=\"&TODAY(), 'Master Tracker'!S{start_row}:S{end_row_master}, \"<>Applied\", 'Master Tracker'!S{start_row}:S{end_row_master}, \"<>Closed\")", "Urgent deadline window", kpi_danger_border)
    render_kpi_card(ws_dash, "H13", "H15", "DEADLINES WITHIN 30 DAYS", f"=COUNTIFS('Master Tracker'!G{start_row}:G{end_row_master}, \"<=\"&TODAY()+30, 'Master Tracker'!G{start_row}:G{end_row_master}, \">=\"&TODAY(), 'Master Tracker'!S{start_row}:S{end_row_master}, \"<>Applied\", 'Master Tracker'!S{start_row}:S{end_row_master}, \"<>Closed\")", "Medium-term deadlines", kpi_warn_border)
    render_kpi_card(ws_dash, "J13", "J15", "CONFIRMED ELIGIBLE HUBS", f"=COUNTIF('Master Tracker'!K{start_row}:K{end_row_master}, \"Confirmed eligible\")", "Proven visa & international hubs", kpi_success_border)

    # Set column widths for Dashboard
    ws_dash.column_dimensions["A"].width = 4
    ws_dash.column_dimensions["B"].width = 24
    ws_dash.column_dimensions["C"].width = 4
    ws_dash.column_dimensions["D"].width = 24
    ws_dash.column_dimensions["E"].width = 4
    ws_dash.column_dimensions["F"].width = 24
    ws_dash.column_dimensions["G"].width = 4
    ws_dash.column_dimensions["H"].width = 24
    ws_dash.column_dimensions["I"].width = 4
    ws_dash.column_dimensions["J"].width = 24

    # -------------------------------------------------------------
    # BREAKDOWN TABLES ON DASHBOARD
    # -------------------------------------------------------------
    # Table 1: Regional Distribution by Priority (Row 18)
    ws_dash["B18"] = "REGIONAL PORTFOLIO BREAKDOWN"
    ws_dash["B18"].font = Font(name=font_family, size=11, bold=True, color="1E3A8A")
    
    headers_reg = ["Region", "Priority A", "Priority B", "Total Targets"]
    for c_idx, h_text in enumerate(headers_reg, start=2):
        col_letter = get_column_letter(c_idx)
        cell = ws_dash[f"{col_letter}19"]
        cell.value = h_text
        cell.font = Font(name=font_family, size=9, bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = header_border

    regions = [
        ("North America / Global", "*North America*"),
        ("Europe / Global", "*Europe*"),
        ("Asia / Global", "*Asia*"),
        ("Global / Remote", "*Remote*")
    ]
    
    for r_idx, (reg_name, reg_pattern) in enumerate(regions, start=20):
        # Region Name
        cell_reg = ws_dash[f"B{r_idx}"]
        cell_reg.value = reg_name
        cell_reg.font = bold_data_font
        cell_reg.border = data_border
        
        # Priority A Count formula
        cell_a = ws_dash[f"C{r_idx}"]
        cell_a.value = f'=COUNTIFS(\'Master Tracker\'!$C${start_row}:$C${end_row_master}, "{reg_pattern}", \'Master Tracker\'!$D${start_row}:$D${end_row_master}, "A")'
        cell_a.font = data_font
        cell_a.alignment = align_center
        cell_a.border = data_border
        
        # Priority B Count formula
        cell_b = ws_dash[f"D{r_idx}"]
        cell_b.value = f'=COUNTIFS(\'Master Tracker\'!$C${start_row}:$C${end_row_master}, "{reg_pattern}", \'Master Tracker\'!$D${start_row}:$D${end_row_master}, "B")'
        cell_b.font = data_font
        cell_b.alignment = align_center
        cell_b.border = data_border
        
        # Total
        cell_tot = ws_dash[f"E{r_idx}"]
        cell_tot.value = f'=SUM(C{r_idx}:D{r_idx})'
        cell_tot.font = bold_data_font
        cell_tot.alignment = align_center
        cell_tot.border = data_border

    # Total Row
    tot_row_reg = 24
    ws_dash[f"B{tot_row_reg}"] = "Total"
    ws_dash[f"B{tot_row_reg}"].font = bold_data_font
    ws_dash[f"B{tot_row_reg}"].border = data_border
    ws_dash[f"C{tot_row_reg}"] = f"=SUM(C20:C23)"
    ws_dash[f"C{tot_row_reg}"].font = bold_data_font
    ws_dash[f"C{tot_row_reg}"].alignment = align_center
    ws_dash[f"C{tot_row_reg}"].border = data_border
    ws_dash[f"D{tot_row_reg}"] = f"=SUM(D20:D23)"
    ws_dash[f"D{tot_row_reg}"].font = bold_data_font
    ws_dash[f"D{tot_row_reg}"].alignment = align_center
    ws_dash[f"D{tot_row_reg}"].border = data_border
    ws_dash[f"E{tot_row_reg}"] = f"=SUM(E20:E23)"
    ws_dash[f"E{tot_row_reg}"].font = bold_data_font
    ws_dash[f"E{tot_row_reg}"].alignment = align_center
    ws_dash[f"E{tot_row_reg}"].border = data_border

    # Table 2: Visa Sponsorship Breakdown (Row 18, Col G to I)
    ws_dash["G18"] = "VISA SPONSORSHIP STATUS DISTRIBUTION"
    ws_dash["G18"].font = Font(name=font_family, size=11, bold=True, color="1E3A8A")
    
    headers_spons = ["Sponsorship Category", "Company Count", "% of Portfolio"]
    for c_idx, h_text in enumerate(headers_spons, start=7):
        col_letter = get_column_letter(c_idx)
        cell = ws_dash[f"{col_letter}19"]
        cell.value = h_text
        cell.font = Font(name=font_family, size=9, bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = header_border

    spons_categories = [
        "Sponsorship explicitly offered",
        "Role-specific; verify",
        "Not stated; research required",
        "Existing work authorization required",
        "Sponsorship explicitly unavailable"
    ]
    
    for s_idx, s_cat in enumerate(spons_categories, start=20):
        # Category Name
        cell_scat = ws_dash[f"G{s_idx}"]
        cell_scat.value = s_cat
        cell_scat.font = data_font
        cell_scat.border = data_border
        
        # Count formula
        cell_sval = ws_dash[f"H{s_idx}"]
        cell_sval.value = f'=COUNTIF(\'Master Tracker\'!$L${start_row}:$L${end_row_master}, "{s_cat}")'
        cell_sval.font = bold_data_font
        cell_sval.alignment = align_center
        cell_sval.border = data_border
        
        # Percentage formula
        cell_spct = ws_dash[f"I{s_idx}"]
        cell_spct.value = f'=H{s_idx}/COUNTA(\'Master Tracker\'!$B${start_row}:$B${end_row_master})'
        cell_spct.font = data_font
        cell_spct.number_format = '0.0%'
        cell_spct.alignment = align_center
        cell_spct.border = data_border

    # Total Row for Sponsorship
    tot_row_spons = 25
    ws_dash[f"G{tot_row_spons}"] = "Total Tracked"
    ws_dash[f"G{tot_row_spons}"].font = bold_data_font
    ws_dash[f"G{tot_row_spons}"].border = data_border
    ws_dash[f"H{tot_row_spons}"] = f"=SUM(H20:H24)"
    ws_dash[f"H{tot_row_spons}"].font = bold_data_font
    ws_dash[f"H{tot_row_spons}"].alignment = align_center
    ws_dash[f"H{tot_row_spons}"].border = data_border
    ws_dash[f"I{tot_row_spons}"] = f"=SUM(I20:I24)"
    ws_dash[f"I{tot_row_spons}"].font = bold_data_font
    ws_dash[f"I{tot_row_spons}"].number_format = '0.0%'
    ws_dash[f"I{tot_row_spons}"].alignment = align_center
    ws_dash[f"I{tot_row_spons}"].border = data_border

    # -------------------------------------------------------------
    # CHARTS ON DASHBOARD
    # -------------------------------------------------------------
    # Chart 1: Bar Chart of Region by Priority A and B
    chart_reg = BarChart()
    chart_reg.type = "col"
    chart_reg.style = 10
    chart_reg.title = "Target Companies by Geographic Region & Priority"
    chart_reg.y_axis.title = "Number of Target Companies"
    chart_reg.x_axis.title = "Region"
    chart_reg.width = 15
    chart_reg.height = 9
    
    data_reg = Reference(ws_dash, min_col=3, min_row=19, max_col=4, max_row=23)
    cats_reg = Reference(ws_dash, min_col=2, min_row=20, max_row=23)
    chart_reg.add_data(data_reg, titles_from_data=True)
    chart_reg.set_categories(cats_reg)
    ws_dash.add_chart(chart_reg, "B27")

    # Chart 2: Bar Chart of Visa Sponsorship Breakdown
    chart_spons = BarChart()
    chart_spons.type = "bar"
    chart_spons.style = 13
    chart_spons.title = "International Student Visa Sponsorship Landscape"
    chart_spons.x_axis.title = "Number of Companies"
    chart_spons.y_axis.title = "Sponsorship Category"
    chart_spons.width = 16
    chart_spons.height = 9
    
    data_spons = Reference(ws_dash, min_col=8, min_row=19, max_col=8, max_row=24)
    cats_spons = Reference(ws_dash, min_col=7, min_row=20, max_row=24)
    chart_spons.add_data(data_spons, titles_from_data=True)
    chart_spons.set_categories(cats_spons)
    chart_spons.legend = None # Only 1 series
    ws_dash.add_chart(chart_spons, "G27")

    # =============================================================
    # SHEET 4: READ ME
    # =============================================================
    ws_readme = wb.create_sheet(title="Read Me")
    ws_readme.views.sheetView[0].showGridLines = True

    readme_content = [
        ("2027 SOFTWARE ENGINEERING INTERNSHIP RECRUITING GUIDE", "title"),
        ("Strategic Playbook, Methodology & Operational Manual for International Applicants", "subtitle"),
        ("Candidate Profile: 1st Year Computer Science Undergraduate at Kwame Nkrumah University of Science and Technology (KNUST), Ghana", "meta"),
        ("Primary Goal: Backend Software Engineering, Distributed Systems, Cloud Platforms, and Infrastructure Systems", "meta"),
        ("", "spacing"),
        
        ("1. WORKBOOK ARCHITECTURE & NAVIGATION", "section"),
        ("This workbook is an end-to-end recruitment operations platform configured specifically for your 2027 Software Engineering Internship search across Europe, Asia, and North America. It is organized into four purpose-built worksheets:", "text"),
        ("• Master Tracker (Sheet 1): The central repository containing all 101 target companies across 25 standardized tracking dimensions. Features interactive dropdowns, clickable verified career links, and color-coded conditional formatting.", "bullet"),
        ("• Filtered View (Sheet 2): A dedicated, pre-filtered execution queue populated exclusively with Priority A companies in 'Not checked' status across all geographic regions. Use this to focus on the highest-yield distributed systems opportunities without visual clutter.", "bullet"),
        ("• Dashboard (Sheet 3): An automated executive dashboard providing 14 dynamic recruiting KPIs, regional distribution matrices, visa sponsorship breakdowns, and native Excel analytical charts. Every formula updates instantly upon editing the Master Tracker.", "bullet"),
        ("• Read Me (Sheet 4): This document — providing comprehensive definitions, maintenance procedures, job alert strategies, and an in-depth visa sponsorship playbook tailored to students applying from Ghana.", "bullet"),
        ("", "spacing"),

        ("2. APPLICATION STATUS LIFECYCLE & WORKFLOW", "section"),
        ("The 'Application Status' column tracks your recruitment lifecycle. Use the integrated Excel dropdown to transition companies through these 12 distinct stages:", "text"),
        ("• Not checked: Initial state for all 101 companies. Indicates the company is queued in your database but specific 2027 postings, requirements, or portal openings have not yet been evaluated for the current cycle.", "bullet"),
        ("• Researching: You are actively investigating role requirements, tech stack alignment, hiring manager details, or checking KNUST alumni connections.", "bullet"),
        ("• Not yet open: Verified that 2027 recruiting has not opened yet. Next Follow-Up Date is set to alert you when the opening window approaches.", "bullet"),
        ("• Open - preparing application: The role is active. You are tailoring your backend resume, drafting a tailored cover letter, or seeking a referral before submitting.", "bullet"),
        ("• Ready to apply: Materials and referrals are finalized. Application is ready for immediate submission (prioritize fast submission for rolling roles).", "bullet"),
        ("• Applied: Application submitted via official portal. Record the exact submission date in 'Date Applied'.", "bullet"),
        ("• Assessment pending: Received automated or recruiter-sent Online Assessment (OA) such as HackerRank, CodeSignal, or Codility. Complete within the stated deadline.", "bullet"),
        ("• Interviewing: Progressed to live interview rounds (technical phone screen, system design, or virtual onsite/superday). Update 'Interview Stage' accordingly.", "bullet"),
        ("• Offer received: Formal internship offer extended. Review compensation, location, visa sponsorship paperwork, and acceptance deadlines.", "bullet"),
        ("• Rejected: Application was not selected for this cycle. Review notes, archive date, and focus on other pipeline opportunities.", "bullet"),
        ("• Withdrawn: Candidate chose to withdraw application (e.g. accepted another offer or role was deemed ineligible).", "bullet"),
        ("• Closed: The requisition closed or reached candidate capacity before application could be submitted.", "bullet"),
        ("", "spacing"),

        ("3. PRIORITY TIER METHODOLOGY (A vs B)", "section"),
        ("Priority is a search-order recommendation, not a final verdict on company prestige or your eligibility. The Priority column is completely editable.", "text"),
        ("• Priority A (42 Companies): Tier-1 target powerhouses that operate at massive scale in backend engineering, distributed systems, cloud computing, or low-latency financial systems, and have established global university recruiting infrastructure with demonstrated international visa sponsorship pathways. Investigate these first.", "bullet"),
        ("  - Examples: Google (STEP/SWE), Meta (Meta University/SWE), Microsoft (Explore/SWE), Amazon AWS, Databricks, Stripe, Palantir, Cloudflare, Jane Street, Optiver, Adyen, Booking.com, ByteDance, Mercari Tokyo.", "bullet"),
        ("• Priority B (59 Companies): Excellent secondary targets to investigate after the primary wave. These include high-caliber fintechs, regional commercial banks, enterprise SaaS, hardware conglomerates, and regional platforms where international student sponsorship from non-local universities is either more restrictive, requires pre-existing work authorization, or requires deeper case-by-case verification.", "bullet"),
        ("  - Examples: Monzo (requires UK right to work), Capital One US (no sponsorship), GovTech Singapore (strictly Singapore citizens/PRs), DBS/OCBC/UOB (require Singapore student visa/PR), regional German/Nordic tech firms.", "bullet"),
        ("", "spacing"),

        ("4. HOW TO DISTINGUISH VERIFIED FACTS FROM RESEARCH REQUIRED", "section"),
        ("To ensure absolute integrity, this workbook strictly avoids inventing information:", "text"),
        ("• Verified Facts: Where an official company source explicitly confirms a policy, opening date, or eligibility criteria, it is recorded directly and marked with a 'Last Checked Date'.", "bullet"),
        ("  - Example 1: GovTech Singapore explicitly states internships require Singapore Citizenship or Permanent Residency -> Marked 'Not eligible based on stated requirements' and 'Sponsorship explicitly unavailable'.", "bullet"),
        ("  - Example 2: Capital One US Technology Internship Program job descriptions explicitly state they do not provide visa sponsorship (including J-1/OPT/CPT) -> Marked 'Requires existing work authorization' and 'Sponsorship explicitly unavailable'.", "bullet"),
        ("  - Example 3: Monzo internship postings explicitly state candidates must have the right to work in the UK without sponsorship -> Marked 'Requires existing work authorization'.", "bullet"),
        ("  - Example 4: Mercari Tokyo and Agoda Bangkok explicitly advertise international student visa sponsorship, relocation airfare, and housing for foreign interns -> Marked 'Confirmed eligible' and 'Sponsorship explicitly offered'.", "bullet"),
        ("• Research Required / Role-Specific: Where a company has not publicly committed to a blanket policy for foreign university students, or where policies vary by specific engineering requisition, it is explicitly labeled 'Potentially eligible; verify requirements', 'Role-specific; verify', or 'Research required'. Never assume eligibility merely because a company is a large multinational.", "bullet"),
        ("", "spacing"),

        ("5. STEP-BY-STEP JOB ALERT CONFIGURATION STRATEGY", "section"),
        ("Early detection is the single most critical factor for rolling applications. Configure alerts using these multi-tiered strategies:", "text"),
        ("1. Official Careers Portal Alerts: Create a candidate profile on Workday, Taleo, SuccessFactors, or Greenhouse portals for target firms. Set keyword alerts for 'Software Engineer Intern', 'Systems Intern', and '2027 Intern'.", "bullet"),
        ("2. LinkedIn Company Alerts: Navigate to the target company's LinkedIn Jobs tab. Search 'Intern' with location 'United States', 'United Kingdom', 'Netherlands', 'Germany', or 'Japan'. Click 'Set Alert' (choose 'Daily' notification).", "bullet"),
        ("3. Greenhouse & Lever RSS Feeds: For companies using Greenhouse (Databricks, Stripe, Cloudflare, Miro, Pleo) or Lever (Palantir), append '/jobs' or use public RSS readers to detect new requisitions instantly.", "bullet"),
        ("4. GitHub Early Careers Trackers: Star and watch reputable community repositories tracking Summer 2027 SWE Internships (e.g. SimplifyJobs, Pitt CSC). These often flag openings within minutes of going live.", "bullet"),
        ("5. Google Alerts: Set targeted Google Alerts: [site:lever.co OR site:greenhouse.io \"Software Engineer Intern\" \"2027\"].", "bullet"),
        ("", "spacing"),

        ("6. STRATEGIC IMMIGRATION & VISA PLAYBOOK FOR GHANA (KNUST) APPLICANTS", "section"),
        ("Applying internationally from Ghana involves distinct legal and visa pathways across different target regions:", "text"),
        ("• UNITED STATES (J-1 Intern Visa Pathway):", "subhead"),
        ("  - Foreign university students enrolled in degree-granting academic institutions outside the US (such as KNUST) are legally eligible for the J-1 Intern Visa.", "bullet"),
        ("  - The US employer does not need to sponsor an H-1B lottery. Instead, they partner with a designated US Department of State J-1 Sponsor Agency (e.g. Cultural Vistas, Intrax, InterExchange).", "bullet"),
        ("  - The sponsor agency issues Form DS-2019 (Certificate of Eligibility for Exchange Visitor Status). With the DS-2019, you pay the SEVIS fee and attend a visa interview at the US Embassy in Accra, Ghana.", "bullet"),
        ("  - Big Tech (Google, Meta, Microsoft, Amazon, Apple) and Quant Trading firms (Jane Street, HRT, Two Sigma) routinely pay all agency fees, SEVIS fees, visa fees, and round-trip flights for international interns.", "bullet"),
        ("• UNITED KINGDOM (Temporary Work - Government Authorised Exchange / GAE):", "subhead"),
        ("  - The standard Skilled Worker visa is not used for summer internships. Instead, employers use the Temporary Work - Government Authorised Exchange (GAE) visa (formerly Tier 5).", "bullet"),
        ("  - Employers either hold an A-rated GAE sponsor licence or partner with an overarching body (such as GTI or BUNAC) to issue a Certificate of Sponsorship (CoS).", "bullet"),
        ("  - Global firms (Bloomberg London, Palantir London, Jane Street London, Optiver London) actively support this. However, mid-size UK fintechs (Monzo, Starling Bank) often require pre-existing UK Right to Work.", "bullet"),
        ("• THE NETHERLANDS (Amsterdam Tech Hub - TWV Permit):", "subhead"),
        ("  - Highly attractive destination: English is the universal corporate language in Amsterdam tech.", "bullet"),
        ("  - Dutch law permits non-EU university students to complete an internship under a tri-partite Internship Agreement (Stageovereenkomst) between KNUST, the employer, and you.", "bullet"),
        ("  - The employer (as a recognized IND sponsor) applies for a work permit (TWV - Tewerkstellingsvergunning). Optiver, IMC, Booking.com, Adyen, and Flow Traders frequently sponsor international interns.", "bullet"),
        ("• GERMANY (§15 BeschV Student Internship Regulation):", "subhead"),
        ("  - Under German Employment Regulation §15 BeschV, foreign university students enrolled abroad can complete an internship of up to 90 days (or up to 12 months with Federal Employment Agency ZAV consent).", "bullet"),
        ("  - Major German enterprises (SAP Walldorf, Celonis Munich, Delivery Hero Berlin) have streamlined processes to obtain ZAV pre-approval for international student interns.", "bullet"),
        ("• JAPAN (Tokyo English-First Tech Hubs):", "subhead"),
        ("  - Exceptional high-yield opportunity: Mercari, Rakuten, PayPay, and Sony have English-speaking engineering teams in Tokyo.", "bullet"),
        ("  - They actively recruit international university students globally, sponsor Japanese 'Designated Activities' or technical intern visas, cover round-trip flights from Accra, and provide furnished Tokyo apartments.", "bullet"),
        ("• SINGAPORE (Critical Restriction Notice):", "subhead"),
        ("  - The Singapore Work Holiday Programme (WHP) is legally restricted to students from only 9 specific countries (Australia, France, Germany, Hong Kong, Japan, New Zealand, Switzerland, UK, USA). Ghana is NOT eligible for the WHP.", "bullet"),
        ("  - To intern in Singapore, an employer must sponsor a Training Employment Pass (TEP) or Training Work Permit (TWP). Domestic banks (DBS, OCBC, UOB) and GovTech Singapore generally do not sponsor these for foreign university students.", "bullet"),
        ("", "spacing"),

        ("7. UNDERCLASSMAN (1ST & 2ND YEAR) SPECIALIZED PATHWAYS", "section"),
        ("As a first-year student at KNUST graduating ~2029/2030, you should strategically target early-identification programs:", "text"),
        ("• Google STEP (Student Training in Engineering Program): Tailored specifically for 1st and 2nd year undergraduates. 12-week developmental internship paired with senior engineers.", "bullet"),
        ("• Microsoft Explore Intern: Rotational program across Software Engineering and Product Management for 1st and 2nd year students.", "bullet"),
        ("• Meta University (SWE Track): 10-week summer program combining iOS/Android/Backend development bootcamp followed by production project work.", "bullet"),
        ("• Uber STAR: Dedicated internship program for rising sophomores transitioning from their first to second year of university.", "bullet"),
        ("• Jane Street Focus & INSIGHT: Immersive educational programs for 1st and 2nd year undergraduates with travel stipends and fast-track internship interview pipelines.", "bullet"),
        ("• Open-Eligibility Firms: Top quant firms (Jane Street, Optiver, HRT, Two Sigma) and distributed systems leaders (Databricks, Cloudflare) evaluate technical capability over university year.", "bullet"),
        ("", "spacing"),

        ("8. BACKEND & DISTRIBUTED SYSTEMS TECHNICAL ROADMAP", "section"),
        ("To stand out as an international applicant from KNUST, build deep technical depth across these core domains:", "text"),
        ("• Core Systems Languages: Master Go (concurrency primitives, goroutines, channels) or modern Java/C++ (memory models, multithreading, OOP design).", "bullet"),
        ("• Networking & Protocols: Understand TCP/IP, UDP, HTTP/2, HTTP/3, WebSockets, gRPC, and Protocol Buffers.", "bullet"),
        ("• Distributed Systems Fundamentals: Learn Raft consensus, CAP theorem, Paxos, event-driven architecture, distributed caching (Redis), and message brokers (Kafka/RabbitMQ).", "bullet"),
        ("• Data Storage & Sharding: Master SQL indexing (B-Trees, LSM-Trees), query optimization, PostgreSQL, distributed databases (Spanner, CockroachDB, Cassandra).", "bullet"),
        ("• Infrastructure & Cloud: Containerization with Docker, container orchestration with Kubernetes basics, and fundamental AWS services (EC2, S3, RDS, Lambda).", "bullet"),
        ("• Algorithms & Data Structures: Practice LeetCode (Arrays, Hashing, Two Pointers, Trees, Graphs, Dynamic Programming) to consistently pass 60-minute technical screens.", "bullet")
    ]

    ws_readme.column_dimensions["A"].width = 6
    ws_readme.column_dimensions["B"].width = 110

    readme_title_font = Font(name=font_family, size=15, bold=True, color="1E3A8A")
    readme_sub_font = Font(name=font_family, size=10, italic=True, color="475569")
    readme_meta_font = Font(name=font_family, size=9, bold=True, color="334155")
    section_font = Font(name=font_family, size=12, bold=True, color="0F172A")
    subhead_font = Font(name=font_family, size=10, bold=True, color="1E3A8A")
    text_font = Font(name=font_family, size=9, color="334155")
    bullet_font = Font(name=font_family, size=9, color="1E293B")

    curr_row = 2
    for item in readme_content:
        text, item_type = item
        ws_readme.row_dimensions[curr_row].height = 20
        
        if item_type == "title":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = readme_title_font
            ws_readme.row_dimensions[curr_row].height = 26
        elif item_type == "subtitle":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = readme_sub_font
        elif item_type == "meta":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = readme_meta_font
        elif item_type == "section":
            curr_row += 1
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = section_font
            cell.fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
            ws_readme.row_dimensions[curr_row].height = 24
        elif item_type == "subhead":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = subhead_font
        elif item_type == "text":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = text_font
            cell.alignment = Alignment(wrap_text=True)
            ws_readme.row_dimensions[curr_row].height = 24
        elif item_type == "bullet":
            cell = ws_readme.cell(row=curr_row, column=2, value=text)
            cell.font = bullet_font
            cell.alignment = Alignment(wrap_text=True)
            ws_readme.row_dimensions[curr_row].height = 26
        elif item_type == "spacing":
            ws_readme.row_dimensions[curr_row].height = 10
            
        curr_row += 1

    # Save workbook
    output_filename = "2027_software_engineering_recruiting_tracker.xlsx"
    wb.save(output_filename)
    print(f"Workbook successfully generated and saved to {output_filename}")

if __name__ == "__main__":
    build_recruiting_tracker()
