function genTimeSlots() {
    let now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    let min = now.getMinutes();
    let st = min > 30 ? now.getHours() + 1 : now.getHours(), end = 20;
    let slots = [];
    if (now.getHours() < end && min < 30) {
        slots.push(`${st}:30 - ${st + 1}:00`);
        st++;
    }
    for (let hr = st; hr < end; hr++) {
        slots.push(`${hr}:00 - ${hr}:30`);
        slots.push(`${hr}:30 - ${hr + 1}:00`);
    }
    return slots;
}
module.exports = genTimeSlots;
