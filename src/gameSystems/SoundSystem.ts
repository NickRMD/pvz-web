const ost1 = new Audio("assets/ost_1.m4a");
const ost2 = new Audio("assets/ost_menu.m4a");

function playStartSound() {
	ost1.play().catch((err) => console.error("Erro ao tocar o som:", err));
	if (ost1.ended || ost1.paused || ost1.currentTime === ost1.duration) {
		ost1.currentTime = 0;
		ost2.play();
	}
}
