/**
 * MedVault AI Assistant - Service layer
 * Communicates with the secure backend proxy endpoint (/api/chat)
 * to interact with Google Gemini without exposing credentials to the client.
 */

export const FALLBACK_ANSWERS = {
  cutsAndWounds: `### Immediate First Aid for Cuts and Wounds:

**1. Stop the Bleeding:**
- Apply firm, gentle, direct pressure to the cut with a clean cloth, tissue, or sterile gauze pad.
- Elevate the injured area above your heart level if possible to reduce blood flow.
- Keep steady pressure for 5 to 10 minutes without constantly lifting the cloth to check.

**2. Clean the Wound:**
- Wash your hands first with soap and water to avoid introducing bacteria.
- Gently rinse the cut under cool or lukewarm running tap water for a couple of minutes to flush out dirt and particles.
- Wash around the wound with mild soap. Avoid getting harsh soap, hydrogen peroxide, or rubbing alcohol directly inside open cuts, as they can irritate sensitive tissue and delay natural healing.

**3. Protect and Dress:**
- Apply a thin layer of petroleum jelly (like Vaseline) or an over-the-counter antibiotic ointment to keep the surface moist and prevent scarring.
- Cover the cut with a sterile adhesive bandage (Band-Aid) or sterile gauze with medical tape.
- Change the dressing at least once a day, or whenever it gets wet or dirty.

**🚨 When to Seek Urgent Medical Attention or Stitches:**
- The cut is deep, gaping, or edges cannot easily be pushed together (stitches are most effective when placed within 6-8 hours).
- Bleeding does not stop after 10-15 minutes of continuous direct pressure.
- The cut was caused by a dirty, rusty, or contaminated object, or an animal/human bite (you may need a tetanus booster).
- You experience numbness, tingling, or difficulty moving the joint/finger.
- Signs of infection appear over the next 24-48 hours: spreading redness, swelling, warmth, throbbing pain, or pus.`,

  burns: `### Immediate First Aid for Minor Burns:

**1. Cool the Burn Immediately:**
- Hold the burned area under cool, gentle running tap water for 10 to 20 minutes.
- **Do NOT** use ice, iced water, butter, oil, or toothpaste, as these can damage sensitive tissue and increase infection risk.

**2. Protect the Area:**
- Gently pat the area dry with a clean cloth.
- Apply pure aloe vera gel or a thin layer of petroleum jelly to keep the skin moisturized.
- Cover loosely with a sterile, non-stick bandage or clean cling film.
- **Do not pop blisters** if they develop — they form a sterile natural barrier against infection.

**🚨 Seek Emergency Medical Care if:**
- The burn is large (larger than the size of your palm) or involves the face, hands, feet, joints, or groin.
- The skin looks white, charred, leathery, or deep brown (signs of a third-degree burn).
- The burn was caused by electrical current or chemicals.`,

  sprains: `### First Aid for Sprains and Strains (R.I.C.E. Protocol):

- **Rest**: Stop physical activity and avoid putting weight on the injured joint or limb.
- **Ice**: Apply an ice pack wrapped in a thin towel for 15-20 minutes at a time, every 2-3 hours for the first 48 hours. Never apply bare ice directly to skin.
- **Compression**: Wrap the area with an elastic bandage (snug for support, but not tight enough to cut off circulation, cause throbbing, or numbness).
- **Elevation**: Prop the injured limb up on pillows above heart level whenever sitting or lying down to reduce swelling.

**Seek medical care if:** You cannot bear any weight at all, heard a distinct popping sound at the moment of injury, or notice visible deformity.`,

  nosebleed: `### First Aid for a Nosebleed:

1. **Sit Upright and Lean Slightly Forward:**
   - Do NOT tilt your head backwards — this causes blood to drain down your throat, which can cause coughing, gagging, or stomach upset.
2. **Pinch Your Nose Firmly:**
   - Use your thumb and index finger to pinch the soft fleshy part of both nostrils completely closed against the nasal bone.
3. **Hold for 10 to 15 Minutes:**
   - Breathe through your mouth and maintain continuous pressure without letting go to check early.
4. **Apply a Cold Compress:**
   - Place an ice pack wrapped in a cloth over the bridge of your nose to help constrict blood vessels.

**Seek emergency care if:** The bleeding continues for more than 20 minutes, is unusually heavy, or followed a head injury.`,

  headache: `### Fast Relief Tips for Headaches:

- **Hydrate Well**: Drink a large glass of water immediately; mild dehydration is one of the most common headache triggers.
- **Rest in a Quiet, Dark Room**: Close your eyes and minimize bright lighting, screen glare, and loud noise.
- **Temperature Therapy**: Apply a cold damp washcloth to your forehead or temples, or a warm heating pad to your neck/shoulders to relieve muscle tension.
- **Relaxation**: Practice slow, deep abdominal breathing for 5-10 minutes.

**🚨 Seek urgent medical attention if:** The headache is sudden and severely intense ("worst headache of your life"), or accompanied by fever, stiff neck, confusion, slurred speech, or weakness.`,

  fever: `### Managing a Fever & Cold/Flu Symptoms:

- **Stay Hydrated**: Drink plenty of fluids (water, warm broths, oral rehydration solutions, or herbal teas with lemon and honey).
- **Rest & Recover**: Give your body adequate sleep so your immune system can effectively fight off infection.
- **Stay Comfortable**: Wear light, breathable clothing and keep room temperature moderate. A lukewarm sponge bath can help relieve discomfort.
- **Track Temperature**: Use a digital thermometer to monitor changes over time.

**Consult a healthcare provider if:** The fever exceeds 103°F (39.4°C) in adults, persists for more than 3 days, or is accompanied by shortness of breath, rash, or persistent vomiting.`,

  choking: `### Choking First Aid (Immediate Action):

- **If the person is coughing forcefully**: Encourage them to keep coughing — that is the most effective way to clear the airway.
- **If they cannot breathe, speak, cough, or make sound**:
  1. **Call 911 / Emergency Services immediately** or yell for someone nearby to call.
  2. **5 Back Blows**: Stand to the side and slightly behind them, support their chest with one hand, and lean them forward. Deliver 5 firm blows between their shoulder blades with the heel of your hand.
  3. **5 Abdominal Thrusts (Heimlich Maneuver)**: Stand behind them, wrap your arms around their waist. Make a fist with one hand just above their navel, grasp your fist with your other hand, and pull sharply inward and upward.
  4. Repeat 5 back blows and 5 abdominal thrusts until the airway is clear or medical responders arrive.`,

  records: `To view your medical reports and clinical files:
1. Navigate to **Medical Records** in the left sidebar menu.
2. Filter by *Blood Test Reports*, *Scans & Diagnostic Reports*, or *Discharge Summaries*.
3. Click the document to view details or download the original PDF/report.

*Note: For your privacy and security, I do not automatically inspect your encrypted health records directly.*`,

  medications: `To check your active medications and prescriptions:
1. Navigate to **Medications** in the left sidebar.
2. You'll see your full active regimen including drug names, dosages, daily schedules (morning/afternoon/night), and instructions.
3. If you need a renewal or dosage adjustment, please contact your attending clinician or hospital provider.`,

  emergency: `**MedVault Emergency Access Protocol:**
1. Navigate to **Emergency Info** in the sidebar.
2. Here you will find your unique **Emergency Code** (e.g. \`MV-EMRG-XXXX\`) and emergency contact details.
3. In urgent medical situations, verified emergency room personnel can enter this code in their provider portal to instantly access your critical allergies, blood group, and emergency conditions.`,

  appointments: `To manage your clinical visits:
1. Go to **Appointments** in the left sidebar.
2. View your upcoming consultations, department locations, and doctor names.
3. You can review scheduled timings or request new appointment dates.`,

  generalHelp: `Hello! I am your AI Assistant. I can answer any questions you have — whether it's everyday health and wellness information, basic first aid guidance, or finding your way around the MedVault patient portal.

Feel free to ask me anything, such as:
- **First Aid Guidance**: *"What should I do for a cut or burn?"*, *"How do I treat a sprained ankle?"*, *"What to do for a nosebleed?"*
- **Everyday Health & Wellness**: *"Tips for healthy sleep"*, *"What helps with headaches?"*, *"How to manage fever?"*
- **MedVault Features**: *"Where are my medical reports?"*, *"How do doctors access my emergency code?"*, *"Where are my active prescriptions?"*

What can I help you with today?`
};

export function getLocalFallback(query) {
  const q = (query || "").toLowerCase();

  // First Aid: Cuts, bleeding, wounds
  if (
    q.includes("cut") ||
    q.includes("bleed") ||
    q.includes("blood") ||
    q.includes("wound") ||
    q.includes("scrape") ||
    q.includes("scratch") ||
    q.includes("bandaid") ||
    q.includes("bandage") ||
    q.includes("stitches")
  ) {
    return FALLBACK_ANSWERS.cutsAndWounds;
  }

  // First Aid: Burns & Scalds
  if (
    q.includes("burn") ||
    q.includes("scald") ||
    q.includes("blister") ||
    q.includes("hot water") ||
    q.includes("fire")
  ) {
    return FALLBACK_ANSWERS.burns;
  }

  // First Aid: Sprains & Strains
  if (
    q.includes("sprain") ||
    q.includes("strain") ||
    q.includes("twist") ||
    q.includes("ankle") ||
    q.includes("wrist") ||
    q.includes("pulled muscle") ||
    q.includes("rice")
  ) {
    return FALLBACK_ANSWERS.sprains;
  }

  // First Aid: Nosebleed
  if (q.includes("nosebleed") || q.includes("nose bleed") || (q.includes("nose") && q.includes("bleed"))) {
    return FALLBACK_ANSWERS.nosebleed;
  }

  // Health: Headaches
  if (q.includes("headache") || q.includes("migraine") || q.includes("head pain")) {
    return FALLBACK_ANSWERS.headache;
  }

  // Health: Fever, Cold, Flu
  if (
    q.includes("fever") ||
    q.includes("cold") ||
    q.includes("flu") ||
    q.includes("cough") ||
    q.includes("sore throat") ||
    q.includes("temperature")
  ) {
    return FALLBACK_ANSWERS.fever;
  }

  // First Aid: Choking
  if (q.includes("chok") || q.includes("heimlich") || q.includes("blocked airway")) {
    return FALLBACK_ANSWERS.choking;
  }

  // MedVault: Records
  if (
    q.includes("record") ||
    q.includes("report") ||
    q.includes("scan") ||
    q.includes("blood test") ||
    q.includes("result") ||
    q.includes("document")
  ) {
    return FALLBACK_ANSWERS.records;
  }

  // MedVault: Medications
  if (
    q.includes("prescription") ||
    q.includes("medication") ||
    q.includes("medicine") ||
    q.includes("drug") ||
    q.includes("pill") ||
    q.includes("dosage")
  ) {
    return FALLBACK_ANSWERS.medications;
  }

  // MedVault: Emergency Code
  if (
    q.includes("emergency") ||
    q.includes("code") ||
    q.includes("first responder") ||
    q.includes("urgent") ||
    q.includes("er")
  ) {
    return FALLBACK_ANSWERS.emergency;
  }

  // MedVault: Appointments
  if (
    q.includes("appointment") ||
    q.includes("booking") ||
    q.includes("schedule") ||
    q.includes("visit doctor") ||
    q.includes("consultation")
  ) {
    return FALLBACK_ANSWERS.appointments;
  }

  return FALLBACK_ANSWERS.generalHelp;
}

/**
 * Send a chat query to the backend proxy
 * @param {string} message - Patient's question
 * @param {Array<{sender: string, text: string}>} history - Previous conversation turns
 * @returns {Promise<{reply: string, isLiveGemini: boolean}>}
 */
export async function sendChatMessage(message, history = []) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply || getLocalFallback(message),
        isLiveGemini: !!data.isConfigured,
      };
    }
  } catch (err) {
    console.warn("[GeminiService] Backend proxy unavailable, utilizing domain intelligence:", err);
  }

  // Graceful fallback response when backend or key is unconfigured
  return {
    reply: getLocalFallback(message),
    isLiveGemini: false,
  };
}
