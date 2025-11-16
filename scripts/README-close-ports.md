# close_ports_and_processes.ps1 — instrukcja (PL)

Krótko: skrypt do zamykania procesów nasłuchujących na podanych portach oraz zamykania procesów po nazwie. Można też dodać regułę zapory blokującą port.

Użycie:

- Wywołanie z .bat (w katalogu projektu):

  diagnoze-problem.bat close-ports -Ports 3000 9229 -Block -Force

  lub

  diagnoze-problem.bat close-procs node chrome -Force

- Wywołanie bezpośrednio w PowerShell:

  .\scripts\close_ports_and_processes.ps1 -Ports 3000,9229 -Block -Force

Parametry:
-Ports <int[]> — lista portów do zamknięcia
-ProcessNames <string[]> — lista nazw procesów
-Block — dodaje regułę zapory (wymaga uruchomienia PowerShell jako Administrator)
-Force — wymusza zamknięcie bez potwierdzeń
-WhatIf — pokazuje jakie akcje zostałyby wykonane (suchy przebieg)

Uwagi bezpieczeństwa i uprawnień:

- Dodawanie reguł zapory wymaga praw administratora. Jeśli skrypt nie ma uprawnień, pominie blokowanie portu i wyświetli ostrzeżenie.
- Zabijanie procesów może spowodować utratę niezapisanych danych. Używaj `-Force` rozważnie.

Przykłady:

- Suchy przebieg: pokazuje co by się stało
  .\scripts\close_ports_and_processes.ps1 -Ports 3000 -WhatIf

- Zamykanie portu 3000 i dodanie reguły blokującej:
  .\scripts\close_ports_and_processes.ps1 -Ports 3000 -Block -Force

Kontakt:
Plik wygenerowany automatycznie przez narzędzie pomocnicze — sprawdź przed użyciem.
