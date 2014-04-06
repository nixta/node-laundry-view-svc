node-laundry-view-svc
=====================

An ExpressJS server providing JSON output for current Laundry Room statuses in Stuyvesant Town.

See it live at [http://st-laundryview.herokuapp.com/rooms](http://st-laundryview.herokuapp.com/rooms).

Individual rooms are under the `/room/<roomId>` resource path. E.g. [http://st-laundryview.herokuapp.com/room/4335325](http://st-laundryview.herokuapp.com/room/4335325).

The original resident access page can be found [here](http://www.laundryview.com/lvs.php?s=219) (expand an address, and click on the revealed identical address to see a Flash animation of the availability).

## Notes
A room is not loaded until required. It is then cached for 60 seconds. Requests within the next 60 seconds do not hit the original data source.
