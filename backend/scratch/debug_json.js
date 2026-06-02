const fs = require('fs');

const rawJson = `{
  "lessonContent": {
    "overview": "This lesson explores the 'Classical Method' of transient analysis, focusing on first-order RL and RC circuits. We will dive deep into the mathematical foundations of differential equations, the physical behavior of energy storage elements, and the step-by-step procedure to determine how circuits transition from one steady state to another when a switch is flipped.",
    "explanation": "In circuit theory, steady-state analysis assumes that voltages and currents have reached a constant or periodic behavior. However, when a circuit configuration changes (e.g., a switch opens or closes), the circuit undergoes a transition period known as the 'transient' state. This occurs because Inductors and Capacitors store energy and cannot change their state (current in inductors, voltage in capacitors) instantaneously. The Classical Method uses first-order linear differential equations to model this behavior, solving for a total response composed of a natural response (due to internal energy) and a forced response (due to external sources).",
    "example": "Consider a simple RC circuit where a 10V DC source is connected to a 1k-ohm resistor and a 1uF capacitor at t=0. We will calculate the voltage across the capacitor at any time t > 0, showing how it climbs from 0V toward its final 10V steady state.",
    "summary": "Transient analysis is the study of a circuit's behavior during the change from one steady state to another. For RL and RC circuits, this involves solving first-order differential equations where the solution is an exponential function characterized by a time constant (RC or L/R).",
    "practiceTip": "Always determine the initial conditions (at t=0-) before the switch moves. Remember: Capacitor voltage and Inductor current cannot jump suddenly!",
    "keyPoints": [
      "Transients occur due to energy storage in L and C.",
      "Total Response = Natural Response + Forced Response.",
      "The time constant (tau) determines how fast the circuit reaches steady state (approx. 5 * tau).",
      "The Classical Method relies on solving KVL/KCL differential equations directly."
    ],
    "pdfTitle": "Transient_Analysis_Classical_Method_BTech_Notes",
    "generatedForLevel": "beginner",
    "notesVersion": 2,
    "blocks": [
      {
        "blockId": "block-01",
        "type": "intro",
        "title": "Understanding Transients: The 'Why' and 'When'",
        "body": "Imagine you are running a bath. When you turn the tap on, the water level doesn't instantly jump to the top; it rises over time. In electrical circuits, **transients** are that 'rising time'. \\n\\n> 🔗 Real-world analogy: Think of a heavy flywheel. You can't make it spin at 1000 RPM instantly; you have to apply force and wait for it to accelerate. In circuits, Inductors are like the 'mass' of the flywheel (resisting changes in current), and Capacitors are like 'springs' (resisting changes in voltage).\\n\\n### Why do we study this?\\n1. **Safety:** High voltage spikes during switching can destroy components.\\n2. **Speed:** In digital computers, transients limit how fast we can flip bits (0 to 1).\\n3. **Control:** Designing timers and oscillators depends entirely on these transition periods.",
        "code": "",
        "language": "",
        "callout": "💡 Key insight: Transients only exist because Inductors and Capacitors store energy. A purely resistive circuit has ZERO transient time!",
        "blockSummary": "Introduces transients as the transition period between steady states caused by energy storage elements."
      },
      {
        "blockId": "block-02",
        "type": "concept",
        "title": "The Mathematical Pillars: Natural vs. Forced Response",
        "body": "The Classical Method views the total behavior of a circuit variable $x(t)$ (which could be voltage or current) as the sum of two parts:\\n\\n1.  **Natural Response ($x_n(t)$):** Also called the 'Complementary Function'. This is what the circuit does on its own using its stored energy, assuming all external sources are turned off. It always dies out over time (decay).\\n2.  **Forced Response ($x_f(t)$):** Also called the 'Particular Integral'. This is what the external source (battery or signal generator) 'forces' the circuit to do in the long run (as $t \\\\to \\\\infty$).\\n\\n**The Equation:**\\n$$x(t) = x_n(t) + x_f(t)$$\\n\\nFor first-order circuits, the natural response always takes the form:\\n$$x_n(t) = K e^{-t/\\\\tau}$$\\nWhere:\\n- $K$ is a constant determined by initial conditions.\\n- \\\\tau (Tau) is the **Time Constant**.",
        "code": "",
        "language": "",
        "callout": "⚠️ Common mistake: Students often forget that the total response is the SUM. Don't just solve for the decaying part and stop!",
        "blockSummary": "Explains the decomposition of circuit response into natural and forced components."
      },
      {
        "blockId": "block-03",
        "type": "diagram",
        "title": "Visualizing the Classical Method Workflow",
        "body": "Before we dive into the math, let's look at the logical 'algorithm' you should follow every time you solve a transient problem.\\n\\n\`\`\`mermaid\\ngraph TD\\n  START([\\"Start: Switch moves at t=0\\"]) -- \\"Step 1\\" --> INIT[[\\"Analyze t < 0: Find Initial Energy Stored\\"]]\\n  INIT -- \\"finds\\" --> VALS[(\\"Initial Values: Vc(0) or IL(0)\\")]\\n  VALS -- \\"Step 2\\" --> KVL{{\\"Apply KVL/KCL for t > 0\\"}}\\n  KVL -- \\"produces\\" --> DIFF[[\\"First Order Differential Equation\\"]]\\n  DIFF -- \\"Step 3\\" --> SOLVE{\\"Solve Equation Components\\"}\\n  SOLVE -- \\"Homogeneous\\" --> NAT((\\"Natural Response: Ke^-t/τ\\"))\\n  SOLVE -- \\"Particular\\" --> FOR((\\"Forced Response: Steady State Value\\"))\\n  NAT -- \\"combine\\" --> TOTAL([\\"Total Response: x(t) = xn + xf\\"])\\n  FOR -- \\"combine\\" --> TOTAL\\n  TOTAL -- \\"Step 4\\" --> CONST[[\\"Apply Initial Values to find K\\"]]\\n\`\`\`\\n\\n**How to read this diagram:**\\n1. **The Stadium nodes** represent the start and the calculation of the final constant.\\n2. **The Hexagon** shows the core physics step: writing the loop/node equations.\\n3. **The Circles** represent the two mathematical paths that must be merged to get the final answer.\\n4. **The Process** flows from initial state analysis to the final mathematical expression.",
        "code": "",
        "language": "",
        "callout": "",
        "blockSummary": "A flowchart detailing the four-step process for solving transient problems using the classical method."
      },
      {
        "blockId": "block-04",
        "type": "concept",
        "title": "Deep Dive: The RC Circuit (Charging)",
        "body": "In an RC circuit, we are usually interested in the Capacitor Voltage $v_c(t)$. \\n\\n### 1. The Differential Equation\\nUsing KVL in a series RC circuit with a source $V_s$:\\n$$R i(t) + v_c(t) = V_s$$\\nSince $i(t) = C \\\\frac{dv_c}{dt}$, we substitute:\\n$$RC \\\\frac{dv_c}{dt} + v_c(t) = V_s$$\\n\\n### 2. The Time Constant (\\\\tau)\\nFor RC circuits, \\\\tau = R \\\\times C$. It is measured in seconds. It represents the time required for the response to decay to $36.8\\\\%$ of its initial value or rise to $63.2\\\\%$ of its final value.\\n\\n### 3. The General Solution\\n$$v_c(t) = V_s + (V_0 - V_s)e^{-t/RC}$$\\nWhere:\\n- $V_s$ = Final Steady State voltage (Forced Response).\\n- $V_0$ = Initial voltage at $t=0$.",
        "code": "",
        "language": "",
        "callout": "💡 Key insight: After 5 time constants ($5\\\\tau$), the transient is considered over because the exponential term becomes negligible ($e^{-5} \\\\approx 0.0067$).",
        "blockSummary": "Derives the RC circuit differential equation and defines the time constant.",
        "inlineChallenge": {
          "type": "fill-in-the-blank",
          "question": "If R = 2k ohms and C = 5uF, what is the time constant tau in milliseconds?",
          "codeTemplate": "R = 2000\\nC = 0.000005\\ntau = R * C\\nprint(tau * 1000) # Output in ms is ___",
          "expectedAnswer": "10",
          "hint": "Multiply 2000 by 0.000005, then multiply by 1000 to convert to ms."
        }
      },
      {
        "blockId": "block-05",
        "type": "example",
        "title": "Solved Problem: RC Step Response",
        "body": "**Problem:** A circuit has a 20V DC source, a switch, a $10k\\\\Omega$ resistor, and a $100\\\\mu F$ capacitor in series. The capacitor is initially uncharged. The switch closes at $t=0$. Find the expression for $v_c(t)$ and the value at $t = 1s$.\\n\\n**Step 1: Identify Parameters**\\n- $V_s = 20V$\\n- $R = 10,000 \\\\Omega$\\n- $C = 100 \\\\times 10^{-6} F$\\n- Initial Voltage $V_0 = 0V$\\n\\n**Step 2: Calculate Time Constant (\\\\tau)**\\n$$\\\\tau = R \\\\times C = 10,000 \\\\times 100 \\\\times 10^{-6} = 1.0 \\\\text{ second}$$\\n\\n**Step 3: Apply the General Formula**\\n$$v_c(t) = V_s + (V_0 - V_s)e^{-t/\\\\tau}$$\\n$$v_c(t) = 20 + (0 - 20)e^{-t/1}$$\\n$$v_c(t) = 20(1 - e^{-t}) \\\\text{ Volts}$$\\n\\n**Step 4: Calculate for t = 1s**\\n$$v_c(1) = 20(1 - e^{-1}) = 20(1 - 0.368) = 20(0.632) = 12.64V$$\\n\\n**Conclusion:** After one time constant, the capacitor has reached $63.2\\\\%$ of the source voltage.",
        "code": "",
        "language": "",
        "callout": "",
        "blockSummary": "Step-by-step calculation for an RC circuit charging from zero."
      },
      {
        "blockId": "block-06",
        "type": "concept",
        "title": "Deep Dive: The RL Circuit",
        "body": "In an RL circuit, we focus on the Inductor Current $i_L(t)$ because inductors resist changes in current.\\n\\n### 1. The Differential Equation\\nUsing KVL in a series RL circuit with source $V_s$:\\n$$R i_L(t) + L \\\\frac{di_L}{dt} = V_s$$\\nDivide by R:\\n$$\\\\frac{L}{R} \\\\frac{di_L}{dt} + i_L(t) = \\\\frac{V_s}{R}$$\\n\\n### 2. The Time Constant (\\\\tau)\\nFor RL circuits, \\\\tau = L / R$. \\nNotice the difference: In RC, R is in the numerator ($RC$). In RL, R is in the denominator ($L/R$). This means a larger resistor makes an RC circuit slower, but makes an RL circuit faster!\\n\\n### 3. The General Solution\\n$$i_L(t) = I_{final} + (I_{initial} - I_{final})e^{-t/\\\\tau}$$\\nWhere:\\n- $I_{final} = V_s/R$ (The steady state current where L acts as a short circuit).\\n- $I_{initial}$ = The current at $t=0^-$.",
        "code": "",
        "language": "",
        "callout": "⚠️ Common mistake: Forgetting that in DC steady state, an Inductor acts as a short circuit ($0 \\\\Omega$) and a Capacitor acts as an open circuit ($\\\\infty \\\\Omega$).",
        "blockSummary": "Derives the RL circuit differential equation and defines its time constant."
      },
      {
        "blockId": "block-07",
        "type": "example",
        "title": "Solved Problem: RL Source-Free Decay",
        "body": "**Problem:** An inductor ($L=2H$) is in series with a resistor ($R=10\\\\Omega$). Initially, a current of $5A$ is flowing through the inductor. At $t=0$, the source is removed (shorted). Find $i_L(t)$ for $t > 0$.\\n\\n**Step 1: Identify Parameters**\\n- $L = 2H$\\n- $R = 10\\\\Omega$\\n- $I_{initial} = 5A$\\n- $I_{final} = 0A$ (Since no source is present, energy will dissipate).\\n\\n**Step 2: Calculate Time Constant (\\\\tau)**\\n$$\\\\tau = L / R = 2 / 10 = 0.2 \\\\text{ seconds}$$\\n\\n**Step 3: Apply the General Formula**\\n$$i_L(t) = I_{final} + (I_{initial} - I_{final})e^{-t/\\\\tau}$$\\n$$i_L(t) = 0 + (5 - 0)e^{-t/0.2}$$\\n$$i_L(t) = 5e^{-5t} \\\\text{ Amperes}$$\\n\\n**Analysis:** The current starts at 5A and decays exponentially toward zero. At $t=1s$ (which is $5\\\\tau$), the current would be $5e^{-5} \\\\approx 0.033A$, essentially zero.",
        "code": "",
        "language": "",
        "callout": "",
        "blockSummary": "Step-by-step calculation for an RL circuit discharging stored energy."
      },
      {
        "blockId": "block-08",
        "type": "summary",
        "title": "Comparison Table: RC vs RL Circuits",
        "body": "Here is a quick reference to distinguish between the two first-order circuits:\\n\\n| Feature | RC Circuit | RL Circuit |\\n| :--- | :--- | :--- |\\n| **Primary Variable** | Voltage $v_c(t)$ | Current $i_L(t)$ |\\n| **Time Constant (\\\\tau)** | $R \\\\times C$ | $L / R$ |\\n| **Steady State (DC)** | Open Circuit ($i=0$) | Short Circuit ($v=0$) |\\n| **Natural Response** | $V_0 e^{-t/RC}$ | $I_0 e^{-Rt/L}$ |\\n| **Energy Stored In** | Electric Field | Magnetic Field |\\n| **Continuity Rule** | $v_c(0^+) = v_c(0^-)$ | $i_L(0^+) = i_L(0^-)$ |\\n\\n> 💡 Key insight: The 'Continuity Rule' is the most important tool for finding constants. It tells you that the energy state cannot change in the 'instant' the switch moves.",
        "code": "",
        "language": "",
        "callout": "",
        "blockSummary": "Provides a comparison table summarizing the differences between RC and RL transient responses."
      },
      {
        "blockId": "block-09",
        "type": "practice",
        "title": "Quick Concept Check",
        "body": "Let's test your understanding of the forced response and steady state logic.",
        "code": "/* \\nScenario: \\nA circuit has a 12V source, a 4 ohm resistor, \\nand a 2 Henry inductor. \\nThe switch has been closed for a very long time.\\nWhat is the steady-state current (Forced Response)?\\n*/\\n\\nvoltage = 12\\nresistance = 4\\n# In steady state, L is a short circuit (0 ohms)\\ncurrent = voltage / resistance\\nprint(current)",
        "language": "python",
        "callout": "",
        "blockSummary": "A 'guess-output' challenge to reinforce the concept of steady-state inductor behavior.",
        "inlineChallenge": {
          "type": "guess-output",
          "question": "What is the steady-state current in Amperes for the circuit described in the code block?",
          "codeTemplate": "voltage = 12\\nresistance = 4\\ncurrent = voltage / resistance\\nprint(current)",
          "expectedAnswer": "3",
          "hint": "Ohm's Law: I = V / R. In steady state, the inductor doesn't resist DC current."
        }
      }
    ],
    "citations": []
  }
}`;

function sanitizeJsonString(jsonStr) {
    let result = '';
    let i = 0;
    let inString = false;
    
    while (i < jsonStr.length) {
        const char = jsonStr[i];
        
        if (char === '"') {
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && jsonStr[j] === '\\\\') {
                backslashCount++;
                j--;
            }
            
            if (backslashCount % 2 !== 0) {
                result += char;
                i++;
                continue;
            }
            
            let left = jsonStr.slice(0, i).trim();
            let right = jsonStr.slice(i + 1).trim();
            
            let isBoundary = false;
            
            if (!inString) {
                if (left.endsWith('{') || left.endsWith(',') || left.endsWith(':') || left.endsWith('[')) {
                    isBoundary = true;
                }
            } else {
                if (right.startsWith('}')) {
                    if (/^\\}\\s*(,|\\}|\\]|$)/.test(right)) {
                        isBoundary = true;
                    }
                } else if (right.startsWith(']')) {
                    if (/^\\]\\s*(,|\\}|\\]|$)/.test(right)) {
                        isBoundary = true;
                    }
                } else if (right.startsWith(':')) {
                    isBoundary = true;
                } else if (right.startsWith(',')) {
                    let afterComma = right.slice(1).trim();
                    if (afterComma.startsWith('}') || afterComma.startsWith(']')) {
                        isBoundary = true;
                    } else if (afterComma.startsWith('"')) {
                        let nextQuoteIdx = afterComma.indexOf('"', 1);
                        if (nextQuoteIdx !== -1) {
                            let afterNextQuote = afterComma.slice(nextQuoteIdx + 1).trim();
                            if (afterNextQuote.startsWith(':') || afterNextQuote.startsWith(',') || afterNextQuote.startsWith(']') || afterNextQuote.startsWith('}')) {
                                isBoundary = true;
                            }
                        }
                    }
                }
            }
            
            if (!isBoundary) {
                console.log("--- FIRST TRACE NON-BOUNDARY QUOTE ---");
                console.log("CHAR:", char);
                console.log("INDEX:", i);
                console.log("LEFT END:", left.slice(-100));
                console.log("RIGHT START:", right.slice(0, 100));
                console.log("right.startsWith(']'):", right.startsWith(']'));
                console.log("regex test:", /^\]\s*(,|\}|\]|$)/.test(right));
                console.log("inString BEFORE:", inString);
                process.exit(0);
            }
            
            if (isBoundary) {
                result += char;
                inString = !inString;
                i++;
            } else {
                result += '\\"';
                i++;
            }
        } else if (char === '\\\\' && inString) {
            if (i + 1 < jsonStr.length) {
                const nextChar = jsonStr[i + 1];
                if (nextChar === '"' || nextChar === '\\\\' || nextChar === '/') {
                    result += '\\\\' + nextChar;
                    i += 2;
                } else if (nextChar === 'n') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(node|newline|neq|nabla|neg|new)\\b/.test(remaining)) {
                        result += '\\\\\\\\n';
                        i += 2;
                    } else {
                        result += '\\\\n';
                        i += 2;
                    }
                } else if (nextChar === 't') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(times|theta|tan|text|tilde|tau|triangle|top|tfrac|to|therefore|tiny|tr|transpose)\\b/.test(remaining)) {
                        result += '\\\\\\\\t';
                        i += 2;
                    } else {
                        result += '\\\\t';
                        i += 2;
                    }
                } else if (nextChar === 'b') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(beta|begin|bar|mathbf|box|binom|bullet|bmod|bigcap|bigcup|biguplus|bigotimes|bigoplus|bigodot|backslash)\\b/.test(remaining)) {
                        result += '\\\\\\\\b';
                        i += 2;
                    } else {
                        result += '\\\\b';
                        i += 2;
                    }
                } else if (nextChar === 'f') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(frac|forall|flat|frown|footnotesize)\\b/.test(remaining)) {
                        result += '\\\\\\\\f';
                        i += 2;
                    } else {
                        result += '\\\\f';
                        i += 2;
                    }
                } else if (nextChar === 'r') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(right|rho|rangle|real|rightarrow|rbrace|rfloor|rceil|rvert|rVert)\\b/.test(remaining)) {
                        result += '\\\\\\\\r';
                        i += 2;
                    } else {
                        result += '\\\\r';
                        i += 2;
                    }
                } else if (nextChar === 'u') {
                    const remaining = jsonStr.slice(i + 2, i + 6);
                    if (/^[0-9a-fA-F]{4}$/.test(remaining)) {
                        result += '\\\\u' + remaining;
                        i += 6;
                    } else {
                        result += '\\\\\\\\u';
                        i += 2;
                    }
                } else {
                    result += '\\\\\\\\';
                    i++;
                }
            } else {
                result += '\\\\\\\\';
                i++;
            }
        } else {
            result += char;
            i++;
        }
    }
    return result;
}

try {
  const sanitized = sanitizeJsonString(rawJson);
  console.log("SANITIESED LEN:", sanitized.length);
  const parsed = JSON.parse(sanitized);
  console.log("SUCCESSFULLY PARSED!");
} catch (err) {
  console.error("PARSING FAILED WITH ERROR:");
  console.error(err);
  const sanitized = sanitizeJsonString(rawJson);
  const pos = err.message.match(/position (\d+)/);
  if (pos) {
    const idx = parseInt(pos[1], 10);
    console.log("--- ERROR NEIGHBORHOOD ---");
    console.log(sanitized.substring(Math.max(0, idx - 100), Math.min(sanitized.length, idx + 100)));
    console.log("--------------------------");
  }
}
