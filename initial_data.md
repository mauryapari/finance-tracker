I have an excel sheet with tables as defined below. i used this excel to monitor my open posiitons, my cagr for all money invested, my total amount invested over the year and stuff.
 i want to create a dashboard which does the same thing but in a more interactive way. i want to be able to add new positions, update existing ones and see the cagr and other details calculated automatically. can you help me with that? ask any questions you want. i want to setup a nuxt project to implement this and also host it somehwere so that i can use it daily. for storing this data i was thinking i can use localstorage maybe. and make the data easliy exportable and importable.

 here are the details.
this is my open positions table capturing all the places i have invested my money.
Open Posiitons
S. No.	Description	Portfolio %	Stock	Buy Date	Buy Price	Qty	Buy Value	CMP	Peak Price After buy	Dropdown from Peak %	Current Value	% Gain	Annual Gain %	Days	Strategy Name	Target Price	Total Potential Gain	Remaining Gain	Target Value	Stock Exchange

this is my closed positions table capturing all the places i had invested my money and now exited.
Closed Posiitons
S. No.	Description	Stock	Buy Date	Buy Rate	Qty	Buy Value	Sell Date	Sell Price	Sell Value	Gain	Days	% Gain	% Annual Gain

table details the date and amount i invested or took out on that day.
Cagr Calculated

TEXT	Date	Amount	Investment/Out

another table detailing the etfs where my money is invested.
Etfs
S. No.	Type	Portfolio %	Stock	Buy Date	Buy Price	Qty	Buy Value	CMP	Current Value	% Gain	Days	Stock Exchange	Target


these below details i generate from the abvoe tables.
// other details calculated from the above data
Net Value as on	23/04/2026	187254.39		
				
Investment		192662.51		
				
Profit		-5408.12	-3%	
				
CAGR		-4.16%		



open positions data for commodity etfs.
Commodity Etfs
S. No.	Type	Commodity Portfolio %	Stock	Buy Date	Buy Price	Qty	Buy Value	CMP	Current Value	% Gain	Days	Stock Exchange


closed positions data for commodity etfs.
Closed commodity etfs
S. No.	Stock	Buy Date	Buy Rate	Qty	Buy Value	Sell Date	Sell Price	Sell Value	Gain	Days	% Gain	% Annual Gain	Column 14


Commodity Cagr Calculated
TEXT	Date	Amount	Column 2


// other details calculated from the above data
Net Value as on	23/04/2026	32030.11	
			
Investment		23175.46	
			
Profit		8854.65	
			38%
CAGR		133.41%	