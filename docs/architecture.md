# System Architecture - SeniorSafe

## User Interaction Flow (The "How It Works")

This diagram illustrates how a user (the Senior) interacts with the system and how the application responds to those requests to build confidence.

```mermaid
flowchart TD
    %% Actors
    User((Senior User))
    
    %% System Nodes
    Dash[Dashboard]
    Scan[QR Scanner]
    Pay[Payment Screen]
    Pin[PIN Authorization]
    Success[Success Screen]
    Fail[Mistake Warning <br/> 'The Gentle Hand']
    
    %% Logic Gates
    CheckAmount{Amount > ₹5000?}
    CheckPin{PIN Correct?}
    
    %% Flow 1: Normal Transaction
    User -- "1. Opens App" --> Dash
    Dash -- "2. Taps 'Scan QR'" --> Scan
    Scan -- "3. Scans Target" --> Pay
    
    User -- "4. Enters Amount" --> Pay
    Pay --> CheckAmount
    
    %% Path A: Safe Amount
    CheckAmount -- "No (Safe)" --> Pin
    User -- "5. Enters PIN" --> Pin
    Pin --> CheckPin
    
    CheckPin -- "Yes" --> Success
    Success -- "6. Confetti & Points" --> User
    
    %% Path B: Mistake (The Safety Net)
    CheckAmount -- "Yes (Risky!)" --> Fail
    Fail -- "7. 'Did you mean ₹500?'" --> User
    User -- "8. Corrects Amount" --> Pay
    
    %% Styling
    style User fill:#f9f,stroke:#333
    style Dash fill:#e1f5fe
    style Success fill:#e8f5e9,stroke:#2e7d32
    style Fail fill:#ffebee,stroke:#c62828
```

## System Component Overview
Internal technical structure supporting the user flow.

```mermaid
graph TD
    subgraph Browser ["Web Browser (User Device)"]
        direction TB
        
        subgraph App ["React Application"]
            Router["Routing Logic"]
            
            subgraph Views
                V_Dash[Dashboard View]
                V_Sim[Simulator View]
                V_Lab[Scam Lab View]
            end
            
            subgraph Logic ["The Brain (Context)"]
                Wallet[Wallet Context]
                Rules[Safety Rules Engine]
            end
        end
        
        subgraph Data ["Persistence"]
            Store[LocalStorage]
        end
    end
    
    %% Connections
    V_Sim --> Rules
    Rules --> |"Validates"| Wallet
    Wallet --> |"Persists"| Store
```
