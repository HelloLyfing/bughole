# What's bughole

Bughole is a project I develope when I'm working on beibei.com, which mainly focus on enabling PHP debuging even at the pre-production whose internal network cluster exposes nothing but HTTP service at 80 port. 

Bughole accomplishes this by dividing traditional debug client into two parts: 1) the Frontend UI, which can be easily accessed by user end programs like Chrome browser; 2) and the Backend Agent, which lurks in one of the hosts among internal network cluster. The Backend Agent can both communicate with the Frontend UI through HTTP request, and with the Debug Engine (which is Xdebug in this condition) which lies on the same host that Backend Agent exists. So that the Backend Agent can comunicate with the Debug Engine first to retrieve debug data and then send them back to the Frontend UI through HTTP.


# Bughole communicating structure
![](https://raw.githubusercontent.com/HelloLyfing/bughole/master/doc/imgs/bughole-communicate-structure.png)


# Quick start
First, you can walk through below wiki page to quickly integrate bughole with your existing PHP webapp: https://github.com/HelloLyfing/bughole/wiki/Integrate-bughole-with-you-PHP-website-within-5-minutes .

Then, you can learn how to use bughole by reading this wiki page: https://github.com/HelloLyfing/bughole/wiki/How-to-debug-any-php-script-via-bughole-remotely


# Thanks
This project relies on below projects to boot development:
 - Frontend UI: jQuery + Bootstrap + Bootstrap-treeview
 - Backend: socket communicating with Xdebug: https://github.com/vim-vdebug/vdebug/tree/master/pythonx/vdebug
 
