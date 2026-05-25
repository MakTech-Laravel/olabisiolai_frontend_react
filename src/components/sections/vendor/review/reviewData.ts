export type ReviewItem = {
    id: string;
    name: string;
    initials: string;
    date: string;
    rating: number;
    comment: string;
    reply?: string;
};

export const summaryRows = [
    { stars: 5, percent: 78, count: 3 },
    { stars: 4, percent: 67, count: 2 },
    { stars: 3, percent: 46, count: 0 },
    { stars: 2, percent: 46, count: 0 },
    { stars: 1, percent: 46, count: 0 },
];

export const initialReviews: ReviewItem[] = [
    {
        id: "rv-1",
        name: "Funke Adewale",
        initials: "FA",
        date: "2026-03-30",
        rating: 5,
        comment:
            "Absolutely amazing experience! The food was delicious and the ambiance was perfect. Highly recommend!",
        reply: "Thank you so much for your kind words! We're glad you enjoyed your visit.",
    },
    {
        id: "rv-2",
        name: "Ibrahim Musa",
        initials: "IM",
        date: "2026-03-28",
        rating: 4,
        comment: "Great food and service. The jollof rice was exceptional. Only downside was the wait time during peak hours.",
    },
    {
        id: "rv-3",
        name: "Grace Okonkwo",
        initials: "GO",
        date: "2026-03-25",
        rating: 5,
        comment: "Best restaurant in Lekki! The staff are friendly and professional. Will definitely come back!",
        reply: "We appreciate your support! Looking forward to serving you again.",
    },
    {
        id: "rv-4",
        name: "Yusuf Aliyu",
        initials: "YA",
        date: "2026-03-22",
        rating: 4,
        comment: "Good atmosphere and tasty dishes. The grilled chicken was perfect.",
    },
    {
        id: "rv-5",
        name: "Chioma Nnamdi",
        initials: "CN",
        date: "2026-03-20",
        rating: 5,
        comment: "Had my birthday celebration here and it was wonderful! Thank you for making it special.",
        reply: "We were honored to be part of your special day! Thank you!",
    },
];
