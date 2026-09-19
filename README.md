S.E.N.S.E - Smart-resource & Energy Network System for Efficiency
An AI-powered smart building resource management system that moves from reporting waste after it happens to preventing it before it starts.

Overview

Buildings collect a lot of data but rarely understand it. Energy, water, HVAC, and occupancy data sit in separate systems,
control is reactive and cloud-dependent, and there is no safe way to test a change before it goes live.

S.E.N.S.E fuses energy, water, occupancy, and air-quality telemetry into one unified system that senses, predicts, and acts:

- Local edge processing keeps anomaly detection and actuator control running even when the network is down.
- Cloud forecasting and deep reinforcement learning (DRL) continuously optimise comfort, cost, and carbon footprint.
- Digital twin simulation tests every control change virtually before it touches real hardware.
- Privacy-preserving federated learning lets a network of buildings learn together without sharing raw data.

Key Features

- Unified live dashboard - one real-time view of power, water, occupancy, and air quality.
- Edge-first control - anomaly detection and actuator control (HVAC, lighting, valves) run on-site with zero cloud latency.
- Threshold alerts - configurable min/max limits per resource; breaches trigger instant alerts on the dashboard.
- Predictive optimisation - demand forecasting plus a DRL agent balancing comfort, cost, and carbon as a single objective.
- Digital twin - safe "what-if" simulation before any control change is deployed.
- Federated learning - every building's model improves from the whole network's experience, with raw data staying local.
- Role-based access control - Administrator, Owner / Community Manager, and Resident / Guest views with scoped permissions.
- Network request workflow - residents raise network requests; owners and administrators review and manage them.

Architecture & Data Flow

text
```+------------------------------------------------------------------+
| L1  IoT SENSORS                                                  |
| Power | Water | Occupancy | Air quality                          |
+------------------------------------------------------------------+
                                  | raw telemetry
                                  v
+------------------------------------------------------------------+
| L2  EDGE AI  (on-site, offline-first)                            |
| Anomaly detection | Actuator control                             |
| Drives HVAC | Lighting | Valves - works without the cloud        |
+------------------------------------------------------------------+
                  | telemetry + alerts          | optimised setpoints
                  v                             ^
+------------------------------------------------------------------+
| L3  CLOUD BACKEND                                                |
| Demand forecasting | DRL optimiser                               |
| Digital twin (what-if simulation) | Data store & API             |
| Federated learning coordinator | Access control                  |
+------------------------------------------------------------------+
                  | live metrics + alerts       | controls + approvals
                  v                             ^
+------------------------------------------------------------------+
| L4  DASHBOARD                                                    |
| Live metrics | Alerts | Controls | Network requests              |
| Views scoped by role: Administrator | Owner | Resident           |
+------------------------------------------------------------------+

Federated learning loop

```text
Building A edge  <-- encrypted model weights -->  +-------------+
Building B edge  <-- encrypted model weights -->  |  Federated  |
Building N edge  <-- encrypted model weights -->  | coordinator |
                                                  +-------------+
                (raw data never leaves the building)
```

Data flow

1. Sense - sensors stream power, water, occupancy, and air-quality readings.
2. Decide locally - the edge device checks readings against learned baselines and thresholds, and acts on HVAC, lighting, and valves immediately.
3. Forecast & optimise - the cloud forecasts demand and the DRL optimiser proposes better setpoints.
4. Simulate - the digital twin tests each proposed change before it is applied.
5. Present - the dashboard shows live metrics and real-time alerts, scoped to the signed-in role.
6. Learn together - buildings share encrypted model updates, never raw data.

User Roles & System Access

S.E.N.S.E uses role-based access control (RBAC) with three roles. Every view and action is limited to what the role needs.

1. Administrator

  - System-wide control.
  - Manage buildings: add and delete buildings.
  - Assign owners to buildings.
  - Handle global network / firewall requests.
  - Block and unblock users.
  - Monitor overall system and firewall status.

2. Owner / Community Manager

  - Manages an assigned building only.
  - View the residents of their building.
  - Approve and manage localised network requests.
  - Onboard new residents / normal users.
  - Monitor their building's status.

3. User / Resident (including Guest Access)

  - Resident dashboard scoped to their own unit and building.
  - View live unit metrics.
  - Make network requests.
  - View the status of their requests (PENDING, approved, or rejected).
  - Guest access: an unregistered email can sign in as a guest for a chosen building, with limited features. Blocked users are denied access.

Permission Matrix

| Capability | Administrator | Owner / Manager | Resident / Guest |
| :--- | :---: | :---: | :---: |
| Manage buildings (add / delete) | ✅ | - | - |
| Assign owners | ✅ | - | - |
| Block / unblock users | ✅ | - | - |
| Handle global network / firewall requests | ✅ | - | - |
| Monitor overall system status | ✅ | - | - |
| View building residents | ✅ | ✅ (own building) | - |
| Approve / manage network requests | ✅ (global) | ✅ (own building) | - |
| Onboard new residents | - | ✅ | - |
| View live metrics | ✅ (system-wide) | ✅ (own building) | ✅ (own unit) |
| Make network requests | - | - | ✅ |
| View own request status | - | - | ✅ |

Project Roadmap

Phase 1 - Hackathon Prototype (Now)

  - Proof of concept with mock sensor data
  - Dashboard UI with live metrics and threshold alerts
  - Role-based access and network request workflow

Phase 2 - Future Vision

  - Broader smart building portfolio adoption
  - AI-driven predictive resource management at scale

Team
Built by Team ThinkSync 
