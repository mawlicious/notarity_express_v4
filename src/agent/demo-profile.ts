export const DEMO_PHONE = "201090108884";

export const stevenMillerProfile = {
  identity: {
    fullName: "Steven Miller",
    role: "Fund Operations Director",
    firm: "Meridian Ventures",
    currentCity: "Cairo",
    currentCountry: "Egypt",
    language: "English"
  },
  billingDetails: {
    name: "Meridian Ventures",
    firstName: "Steven",
    lastName: "Miller",
    street: "12 Nile View Tower",
    postalCode: "11511",
    city: "Cairo",
    country: "Egypt",
    email: "operations@meridianventures.example"
  },
  contactDetails: {
    sameAsBilling: true,
    fullName: "Steven Miller",
    email: "steven.miller@meridianventures.example",
    phone: "+201090108884"
  },
  recurringWork: {
    description: "Cross-border notarization for European portfolio companies, including powers of attorney, shareholder resolutions, director appointments, and incorporation documents.",
    documentsUsuallyReady: true,
    hardCopyDefault: false,
    newsletterDefault: false
  },
  savedPeople: [
    {
      fullName: "Steven Miller",
      role: "Fund Operations Director and usual coordinator"
    },
    {
      fullName: "Daniel Weber",
      role: "Managing director of Alpine Robotics GmbH",
      email: "daniel.weber@alpinerobotics.example"
    }
  ],
  savedCompanies: [
    {
      name: "Alpine Robotics GmbH",
      jurisdiction: "Austria",
      relationship: "Meridian Ventures portfolio company",
      usualSigner: "Daniel Weber"
    }
  ],
  shortcuts: {
    mondaySpecial: {
      triggerExamples: [
        "Give me the Monday special",
        "Book the Monday special",
        "Let's do the usual Monday one"
      ],
      meaning: {
        destinationCountry: "Austria",
        requestedService: "Power of Attorney notarization for Alpine Robotics GmbH",
        participants: ["Daniel Weber"],
        documentStatus: "Document is normally ready; ask Steven to upload the current PDF because the file itself must never be assumed or remembered.",
        apostille: "Ask only if the live product makes it optional or the current transaction requires a choice; honor product rules if required.",
        appointmentPreference: "First available online appointment on the next Monday at or after 10:00 Cairo local time.",
        billingProfile: "Use saved Meridian Ventures billing details.",
        contactProfile: "Use Steven Miller's saved contact details.",
        hardCopy: false,
        newsletter: false
      }
    }
  },
  safety: {
    neverAssumeCurrentDocument: true,
    requireLiveSlotLookup: true,
    requireLivePricing: true,
    requireExplicitFinalSubmissionConfirmation: true
  }
} as const;
