export type Policy = {
  slug: string;
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

export const policies: Policy[] = [
  {
    slug: "delivery",
    title: "Delivery Policy",
    description:
      "Delivery charges by district, dispatch times and courier coverage for New Step Footwear Store.",
    updated: "August 2026",
    sections: [
      {
        heading: "Coverage",
        body: [
          "We deliver to all 25 districts in Sri Lanka through third-party island-wide courier partners.",
        ],
      },
      {
        heading: "Charges",
        body: [
          "Colombo Rs. 350. Gampaha and Kalutara Rs. 400. Kandy, Galle, Matara, Kurunegala, Ratnapura and Kegalle Rs. 450 – Rs. 480. Northern and Eastern districts Rs. 520 – Rs. 580.",
          "Delivery is free on all orders over Rs. 15,000.",
        ],
      },
      {
        heading: "Dispatch and delivery time",
        body: [
          "Orders confirmed before 3:00pm on a working day are dispatched the same day. Delivery takes 2 – 4 working days depending on district.",
          "We call or WhatsApp before dispatch to confirm the order and size.",
        ],
      },
      {
        heading: "Failed deliveries",
        body: [
          "If the courier cannot reach you after two attempts, the parcel returns to us and the order is cancelled. Repeated failed COD deliveries may require advance payment on future orders.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Exchange Policy",
    description:
      "How to exchange a size or return a faulty pair bought from New Step Footwear Store.",
    updated: "August 2026",
    sections: [
      {
        heading: "Size exchange",
        body: [
          "Unworn shoes in their original box can be exchanged for a different size within 7 days of delivery, subject to availability. Return courier charges are borne by the customer; we cover the cost of sending the replacement.",
        ],
      },
      {
        heading: "Faulty or incorrect items",
        body: [
          "If you receive a manufacturing defect or the wrong item, contact us within 48 hours with photographs. We arrange collection and replacement at our cost, or a full refund.",
        ],
      },
      {
        heading: "Non-returnable items",
        body: [
          "Worn footwear, items without original packaging, and clearance items marked Final Sale cannot be returned or exchanged.",
        ],
      },
      {
        heading: "How to start",
        body: [
          "WhatsApp us on +94 70 305 4532 with your order reference and we will guide you through it.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "What data New Step Footwear Store collects at checkout and how it is used.",
    updated: "August 2026",
    sections: [
      {
        heading: "What we collect",
        body: [
          "At checkout we collect your name, mobile number, email address and delivery address. This is the minimum required to fulfil a cash-on-delivery order.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "Your details are used to confirm, pack and deliver your order, and to contact you about that order. With your consent we may send occasional offers; you can opt out at any time.",
        ],
      },
      {
        heading: "Analytics and advertising",
        body: [
          "We use Meta and TikTok pixels to measure which content leads to orders. These tools may set cookies in your browser. You can block them through your browser settings without affecting your ability to order.",
        ],
      },
      {
        heading: "Sharing and retention",
        body: [
          "We share your name, phone number and address with our courier partner only. We never sell customer data.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description:
      "The terms that apply when you order from New Step Footwear Store online.",
    updated: "August 2026",
    sections: [
      {
        heading: "Orders",
        body: [
          "Placing an order is an offer to buy. The order is accepted once we confirm it by phone, WhatsApp or email. Stock shown on the site is live but in rare cases an item may sell out between order and confirmation, in which case we cancel and inform you.",
        ],
      },
      {
        heading: "Pricing",
        body: [
          "All prices are in Sri Lankan Rupees and include applicable taxes. Delivery is charged separately by district and shown before you confirm.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "Cash on Delivery is currently the only payment method. Please have the exact total ready for the courier.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Product photographs are representative; slight colour variation may occur between screens. Our liability is limited to the value of the order.",
        ],
      },
    ],
  },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
