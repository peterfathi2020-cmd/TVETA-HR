const calculateNextPromotion = (employee: any) => {
    const lastPromotionDate = new Date(employee.last_promotion_date || employee.employment_date);
    const now = new Date("2026-05-12T00:00:00Z"); // Fix 'now' to a static date for testing
    
    let nextPromotionDate = new Date(lastPromotionDate);
    // The very next milestone is at least +5 years from last promotion
    nextPromotionDate.setFullYear(nextPromotionDate.getFullYear() + 5);

    // Advance to the MOST RECENT eligible cycle
    while (true) {
        let tempDate = new Date(nextPromotionDate);
        tempDate.setFullYear(tempDate.getFullYear() + 5);
        if (tempDate <= now) {
            nextPromotionDate = tempDate;
        } else {
            break;
        }
    }
    
    const diffTime = nextPromotionDate.getTime() - now.getTime();
    const yearsRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25)));
    
    let status: 'eligible' | 'upcoming' | 'waiting' = 'waiting';
    if (yearsRemaining <= 0) status = 'eligible';
    else if (yearsRemaining <= 1) status = 'upcoming';
    
    return { nextDate: nextPromotionDate.toISOString(), yearsRemaining, status };
};

const t1 = new Date("2026-05-12T00:00:00Z");
console.log("Current mocked date:", t1.toISOString());

console.log("Hired 2000, today 2026, no promos:", calculateNextPromotion({ employment_date: '2000-05-12T00:00:00Z' }));
console.log("Hired 2000, today 2026, last promo 2020:", calculateNextPromotion({ employment_date: '2000-05-12T00:00:00Z', last_promotion_date: '2020-05-12T00:00:00Z' }));
console.log("Hired 2022, today 2026, no promos:", calculateNextPromotion({ employment_date: '2022-05-12T00:00:00Z' }));
