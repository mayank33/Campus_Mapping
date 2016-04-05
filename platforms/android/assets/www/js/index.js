var map1,edge,total_nodes=0,NodeInfo;
var version = 1.1;
var marker = new Array();
var app = {

    initialize: function() 
    {
        this.bindEvents();
        app.resizeMap();
		
	var map = L.map('map-canvas').setView([17.4453593878408,78.3509433037455 ], 17);
	map1 = map;
	L.tileLayer('img/mapTiles/{z}/{x}/{y}.png', {
		minZoom:17,
		maxZoom: 19
			
	}).addTo(map);
	L.control.scale().addTo(map);
    },
    
    bindEvents: function() 
    {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    onDeviceReady: function() 
    {
        app.receivedEvent('deviceready');
    },
    
    receivedEvent: function(id) 
    {
        var parentElement = document.getElementById(id);
        console.log('Received Event: ' + id);
    },
    
    resizeMap: function()
    {
	$("#map-canvas").height(Math.max(500,$(window).height()-90));
    },
    onGeoSuccess: function(position)
    {
	lat = position.coords.latitude;
	lon = position.coords.longitude;
	//alert(lat+'\n'+lon);
	L.marker([lat,lon]).addTo(map1).bindPopup("<b>You are at </b>" + lat + " " + lon).openPopup();
    },
	
    onGeoError: function(error)
    {
	alert(error.message);
    },
	
    presentloc: function()
    {
	navigator.geolocation.getCurrentPosition(app.onGeoSuccess, app.onGeoError);
    }
};

function downloadFile()
{
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0 , onFileSystemSuccess , fail);
}
function onFileSystemSuccess(fileSystem)
{
       fileSystem.root.getFile("abc.txt", {create: true, exclusive: false},gotFileEntry,fail);
}                
function gotFileEntry(fileEntry) 
{
        //alert(fileEntry.fullPath);
        var sPath = fileEntry.fullPath.replace("abc.txt","");
        
        var fileTransfer = new FileTransfer();
        fileEntry.remove();
        fileTransfer.download("https://dl.dropboxusercontent.com/s/shdnqrdsenrcz72/HelloWorld-debug.apk?dl=1&token_hash=AAFTfAaZSLPoC8VVYnrL8C5cznXEcQX5OsCuiX9uTiNnmA",sPath + "helloworldnew.apk",
                function(theFile) 
                {
                        alert('Download Complete');
                        console.log("download complete: " + theFile.toURI());
                        showLink(theFile.toURI());
                },
                function(error) 
                {
                        alert('Error Downloading File');
                        console.log("download error source " + error.source);
                        console.log("download error target " + error.target);
                        console.log("upload error code: " + error.code);
                }
        );
}

function fail(error) 
{
        alert('No Internet Connection');
        console.log(error.code);
}

function get_total_nodes(node_file)
{
	NodeInfo=new Array(300);
	$.ajax({'async': false,
        'global': false,
        'url': node_file,
        'dataType': "json",
        'success': function(data)
        {
		total_nodes=0;
	        $.each(data,function(i,x)
	        {
		        total_nodes=total_nodes+1;
		        NodeInfo[total_nodes]=new Array(3);
		        NodeInfo[total_nodes][0]=x.name;
		        NodeInfo[total_nodes][1]=x.lati;
		        NodeInfo[total_nodes][2]=x.longi;
	        });
    	}});
}

function create_edge_list(edge_file_name,room_file_name,node_file)
{
	var pos;
	edge=new Array(300);
	$.ajax({'async': false,
                'global': false,
                'url': edge_file_name,
                'dataType': "json",
                'success': function(data)
                {
		        pos=0;
            	        $.each(data,function(i,x)
            	        {
                    		edge[pos]=new Array(3);
                    		edge[pos][0]=get_hash_val(x.first,room_file_name,node_file);
                    		edge[pos][1]=get_hash_val(x.second,room_file_name,node_file);
                    		edge[pos][2]=x.dist;
                    		pos=pos+1;
                    		edge[pos]=new Array(3);
                    		edge[pos][0]=get_hash_val(x.second,room_file_name,node_file);
                    		edge[pos][1]=get_hash_val(x.first,room_file_name,node_file);
                    		edge[pos][2]=x.dist;
                    		pos=pos+1;
            	        });
            	        edge[pos]=new Array(3);
            	        edge[pos][0]=-1;
                	edge[pos][1]=-1;
            	        edge[pos][2]=0;
                }
        });
}

function get_build_id(query, node_file_name)
{
    var flag = 0;
    var index = 0;
    $.ajax({'async': false,
        'global': false,
        'url': node_file_name,
        'dataType': "json",
        'success': function(data)
        {
            $.each(data,function(i,x)
            {
                index=index+1;
                if (x.name.toLowerCase()==query.toLowerCase() )
                {
                        
                    flag=1;
                    return false;
                }
            });
    }});
    if(flag==1)
        return index;
    else
        return -1;
}
function get_hash_val(roomno,room_file_name,node_file)
{
        var ind=get_build_id(roomno,node_file)
        return ind;
}

function get_node_info(node_idx)
{
		return NodeInfo[node_idx];
}

function get_shortest_path(source,destination,edge_file_name,room_file_name,node_file_name)
{
	get_total_nodes(node_file_name);
	create_edge_list(edge_file_name,room_file_name,node_file_name);
	var distance=new Array(total_nodes+1);
	var parent=new Array(total_nodes+1);
	var overlaying_points=new Array(total_nodes+1);
	var x,y;	//iterators;
	var pos,src_idx,des_idx;	
	for(x=1;x<=total_nodes;x++)
	{
		distance[x]=10000;		//initialising distance of every node to be infinite
		parent[x]=x;	//will contain hash_value of node from which we will come to current node
	}
	source = source.replace(/\s+/g, '');
	src_idx=get_hash_val(source,room_file_name,node_file_name);
	des_idx=get_hash_val(destination,room_file_name,node_file_name);

	//----------------------------Error Handling---------------------
	if(src_idx==-1)
	{
		alert('No such location '+source+' exist');
		return;
	}
	if(des_idx==-1)
	{
		alert('No such location '+destination+' exist');
		return;
	}
	//---------------------------Error Handling Done-------------------
	
	//Bellman Ford Algorithm for calculating the shortest path
	distance[src_idx]=0;
	
	for(x=1;x<=total_nodes;x++)
	{
		for(y=0;edge[y][0]!=-1;y++)
		{
			if( (distance[edge[y][0]]+edge[y][2]) < distance[edge[y][1]] )
			{
				distance[edge[y][1]]=distance[edge[y][0]]+edge[y][2];
				parent[edge[y][1]]=edge[y][0];
			}
		}
	}
	//distance calculated above
        
	x=des_idx;pos=0;
	while(true)		//it will store all the nodes which will lie on the shortest path
	{
		overlaying_points[pos]=new Array(3);
		var namelatlong=get_node_info(x);
				
		overlaying_points[pos][0]=namelatlong[0];
		overlaying_points[pos][1]=namelatlong[1];
		overlaying_points[pos][2]=namelatlong[2];
		pos=pos+1;
		
		if(x==parent[x])
			break;
		x=parent[x];
	}
	overlaying_points[pos]=new Array(3);
	overlaying_points[pos][1]=-1;overlaying_points[pos][2]=-1;
	overlay_points_one(overlaying_points,distance[des_idx]);	//it will mark all the nodes on the path*/
}



function overlay_points_one(set_of_points,dist)
{
	var x=0,msg;
	var pointList=[];
	if(set_of_points[1][1]==-1)
	{
		//alert(set_of_points[0][1]+' '+set_of_points[0][2]);
		L.marker([set_of_points[0][1],set_of_points[0][2]]).addTo(map1)
			.bindPopup("A and B").openPopup();
		 
	}
	else
	{
		x=0;
                put_marker(set_of_points[0][1],set_of_points[0][2],"","B");
		while(set_of_points[x+1][1]!=-1)
		{
        		 var item = set_of_points[x];
	        	pointList.push(new L.LatLng(item[1],item[2]) );			
			x=x+1;
		}

	        
                put_marker(set_of_points[x][1],set_of_points[x][2],"","A");		
		pointList.push( new L.LatLng(set_of_points[x][1],set_of_points[x][2]) );
		
		var firstpolyline = new L.Polyline(pointList, {
		        color: 'red',
		        weight: 5,
		        opacity: 0.5,
		        smoothFactor: 1

		});
		firstpolyline.addTo(map1);
	}
}

function put_marker(lat,long,image,msg)
{
        if( image != "")
        {
                var imagepos = "<img src\= "+image+" width\= \"100\" height\= \"100\"/>";
                L.marker([lat,long]).addTo(map1).bindPopup(msg+'<br /><p>'+imagepos +'</p>').openPopup();
        }
        else
        {
                L.marker([lat,long]).addTo(map1).bindPopup(msg).openPopup();
        }
	
}
function search_by_room(building_no,roomno,room_file_name)
{
    if(building_no=="" || roomno=="")
        return -1;

    flag=0;
	building_no=building_no.replace(/\s/g, '');
	roomno=roomno.replace(/\s/g, '');
	$.ajax({'async': false,
        'global': false,
        'url': room_file_name,
        'dataType': "json",
        'success': function(data)
        {
	        $.each(data,function(i,x)
	        {
		        if( ( x.room.toLowerCase()==roomno.toLowerCase() ) && ( x.building.toLowerCase()==building_no.toLowerCase() ) )
	        	{
		        	flag=1;
		        	lat=x.lat;
		        	image=x.img;
		        	long=x.long;
		        	room=x.room;building=x.building;
		        	return false;
	        	}
	        });
	}});

    	if(flag==1)
    	{
    		put_marker(lat,long,image,"Room : "+room+" Building : "+building);
            return 1;
    	}
    	else
    	{
            return -1;
    	}
}

function search_by_name(name,room_file_name)
{
    if(name=="")
        return -1;

    flag=0;
	name=name.replace(/\s/g, '');
	$.ajax({'async': false,
        'global': false,
        'url': room_file_name,
        'dataType': "json",
        'success': function(data)
	   {
    		$.each(data,function(i,x)
    		{
    			if(x.person.toLowerCase()==name.toLowerCase())
    			{
    				flag=1;
    				lat=x.lat;
    				long=x.long;
    				image=x.img;
    				room=x.room;building=x.building;
    				return false;
    			}
    		});
    	}});

    	if(flag==1)
    	{
    		put_marker(lat,long,image,"Room : "+room+" Building : "+building);
    	}
    	else
    	{
            return -1;
    	}
}
function search_by_building(name,building_file_name)
{
    if(name=="")
        return -1;

    flag=0;
	name=name.replace(/\s/g, '');
    $.ajax({'async': false,
        'global': false,
        'url': building_file_name,
        'dataType': "json",
        'success': function(data)
        {
            $.each(data,function(i,x)
            {
                if(x.name.toLowerCase()==name.toLowerCase())
                {
                    flag=1;
                    lat=x.lati;
                    long=x.longi;
                    room=x.name;
                    return false;
                }
            });
        }});

        if(flag==1)
        {
            put_marker(lat,long,"",room);
        }
        else
        {
            return -1;
        }
}
function routing(src_building,src_room,des_building,des_room,edge_file_name,room_file_name,node_file_name)
{
    if(src_building=="" || des_building=="")
    {
        alert('Should Enter Both Source and Destinatoin Building Name');
    }
    else
    {
        if( src_room != "" ) 
        {
            feedback = search_by_room(src_building,src_room,room_file_name);
            if(feedback==-1)
            {
                alert('Invalid Source Room No');
                return;
            }
        }
        if( des_room != "" ) 
        {
            feedback = search_by_room(des_building,des_room,room_file_name);
            if(feedback==-1)
            {
                alert('Invalid Destination Room No');
                return;
            }
        }
        get_shortest_path(src_building,des_building,edge_file_name,room_file_name,node_file_name);    
    }
}
