# This Python file uses the following encoding: utf-8

import commands
import string
import libxml2
import unicodedata
import re
import codecs
from osgeo import osr, gdal
from xml.dom.minidom import parse, parseString
import csv


def main():
	global output_hits
	global error_hits
	global urb_area_t0_counter
	global urb_area_t1_counter
	global urb_footprint_t0_counter
	global urb_footprint_t1_counter
	global resultados_counter

	polygonMap=dict()
	errors=dict()
	errorsPolygon=dict()
	errorsIds = dict()

	commands.getoutput('mkdir output')
	output=open('output/output.csv','w')
	oldTownships=getOldTownships();
	locationCoordinates= ''
	locationPolygon = ''
	Rid=1
	output_hits=0
	resultados_counter = 0 
	newIds = 1000
	# lines = open('municipios.csv','r')	
	# lines = iter(lines)
	# lines.next()
	output.write('Municipio Id, Municipio Nombre,Tipo,Polygon\n')
	shapeFiles = commands.getoutput("find . -name *_zonif.shp")
	
	for shpFile in shapeFiles.split('\n'):
		#print shpFile
		#print len(shpFile.split('/'))

		outputFolder = shpFile[:shpFile.rfind("/")]
		name = shpFile[shpFile.rfind("/")+1:shpFile.rfind("_zonif.shp")]
		#print outputFolder
		name=name.replace('ñ','n')
	 	name=fixName(unicode(name.rstrip(),'utf-8'))
	# 		provincia=elimina_tildes(unicode(provincia.rstrip(),'utf-8'))
		# print name
		# continue
		
		
		polygonsNumber = 0 
		cmd='''ogr2ogr zoning.kml "'''  + shpFile + '''" -f "KML"'''
		p=commands.getoutput(cmd)
		commands.getoutput(''' cp zoning.kml kml/''' + name + ".xml")
		doc=parse("zoning.kml")

		
	
		matchingNodes = [node for node in doc.getElementsByTagName("Placemark")]
		# if(len(matchingNodes)>1000):
		# 	print name + ' has too many polygons...ignoring'
		# 	continue

		id=-1
		if(name in oldTownships):
			print 'found municipio with name: ' + name + ' id: ' + oldTownships[name]
			id=oldTownships[name]
		else:
			print ' not found id for municipio with name: ' + name 
			id=newIds
			newIds+=1
			errorsIds[name]=1
			continue 

		for placemark in matchingNodes:
			if len(placemark.getElementsByTagName('Polygon'))==0:
				print "No polygons placemark in "	 + name
				errorsPolygon[name] = placemark.toxml()
				continue;

			zonif   = 'empty'
			polygon = ''

			#zonifNodes=placemark.getElementsByTagName("ExtendedData")[0].childNodes[0].getElementsByTagName("SimpleData")
			found=False
			zonifNodes=placemark.getElementsByTagName("ExtendedData")[0].childNodes[0].getElementsByTagName('SimpleData')
			for znode in zonifNodes:
				zoningField = znode.getAttribute('name').upper();
				if(zoningField=='ZONIF' or zoningField == "ZONA" ):
					found=True
					zonif=znode.firstChild.nodeValue;		

			
			if not found:
				errors[name]=placemark.toxml()
				print " no zonif found for " + name + " placemark: " + placemark.toxml()
				continue



			polygonNode=placemark.getElementsByTagName('Polygon')[0]
			polygon=polygonNode.toxml()
			if(name not in polygonMap):
				polygonMap[name]=1
			polygonMap[name]+=1
			# print( str(name) +' ' +  str(zonif) + '"\n' )

			output.write(str(id) + ',' + str(name) + ',' + str(zonif) + ',"' + str(polygon) + '",\n')

	for key in errors.keys():
		print "error zoning in " + key + " xml:" + errors[key]

	for key in errorsPolygon.keys():
		print "error polygon in " + key + " xml:" + errorsPolygon[key]

	print(str(len(errorsIds)) + " not found")

	print errorsIds.keys()

	for key in polygonMap:
		print  key + ": " + str(polygonMap[key])

	return


# def processPolygon(r,stacked,result,start,content):
# 	print result

# 	if(not start and r.name=='Polygon'):
# 		result+=content
# 		for node in stacked:
# 			result+=node
# 		return result

# 	if(r.next is not None):
# 		print r.name
# 		result+='<' + r.name + '>'
# 		stacked.append('<' + r.name + '/>')
# 		processPolygon(r.next,stacked,result,False,r.content)
		

	# for l in lines:
	# 	try:
			
	# 		(idd,name,partido,provincia,aglomerado,folder,agregado)=l.split(',')
		
	# 		realName=name
	# 		name=name.replace('ñ','n')
	# 		name=fixName(unicode(name.rstrip(),'utf-8'))
	# 		provincia=elimina_tildes(unicode(provincia.rstrip(),'utf-8'))
	# 		aglomerado=elimina_tildes(unicode(aglomerado.rstrip(),'utf-8'))
	# 		partido=elimina_tildes(unicode(partido.rstrip(),'utf-8'))			
	# 		print name


	# 		sourceShp=getPath(name,folder)

	# 		outputPath='''output/''' + name + '/'

			
	# 		cmd ='''mkdir output/''' + name
	# 		commands.getoutput(cmd)

	# 		outputkml = outputPath + name + '.kml'



	# 		cmd='''ogr2ogr ''' + outputkml +''' "'''  + sourceShp + '''" -f "KML"'''
	# 		#print cmd
					
	# 		p=commands.getoutput(cmd)
	# 		doc=libxml2.parseFile(outputkml)
	# 		ctxt = doc.xpathNewContext() 
	# 		ctxt.xpathRegisterNs('kml', "http://www.opengis.net/kml/2.2")
	# 		res = doc.xpathEval('//*')

 # 			for r in res:
	# 			if  r.name == 'Polygon':
	# 				polyPoints = r.content
	# 				locationPolygon = '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + r.content + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'
	# 				polygonMap[name]=r.content
			
	# 		output.write(str(Rid) + ',' + realName)
	# 		output.write(',' + name + ',"' + locationPolygon + '","' + partido+ '","' + provincia + '","' + aglomerado + '",'+ str(n) +',' + str(s) +',' + str(e) + ',' + str(w) +',' + t0_edge + ',' + t0_open +',' + t1_edge +',' + t1_open + ' \n')
	# 		Rid=Rid+1


	# 	except Exception as err:
	# 		error_hits +=1
	# 		print 'error' + str(err) + " localidad: " + name
	
	# print "empty output hits: " + str(output_hits)
	# print "error_hits hits: " + str(error_hits)
	# print "urb_area_t0_counter " + str(urb_area_t0_counter)
	# print "resultados.txt " + str(resultados_counter)
	# checkPolygonMapDuplicates(polygonMap)

def getPath(name,folder):
	global output_hits
	#cmd = '''find ''' + folder + '''  -name  "''' + name + '''" ''' 
	cmd = '''find ''' + folder + '''  -name  *.shp ''' 
	#print 'FIND command:' + cmd
	
	locOutput=commands.getoutput(cmd)
	if len(locOutput)==0:
		output_hits+=1
	hits=locOutput.split('\n')
	if(len(hits)>1):
		print hits
		for hit in hits:
			if hit.find('localidad') == -1:
				return hit
	else:
		#print 'FIND output ' +  locOutput
		pathLoc=locOutput[0:locOutput.find('.shp')+4]
		return pathLoc

def getDataIndex(name,folder,outputFolder):
	global resultados_counter
	values=[]
	cmd = '''find ''' + folder + '''  -name resultados.txt''' 

	data_index_names = ['t0 EDGE INDEX is','t0 OPENNESS INDEX is','t1 EDGE INDEX is','t1 OPENNESS INDEX is']

	output=commands.getoutput(cmd)
	if(len(output)==0):
		resultados_counter +=1
		return ('','','','')

	resultados_file = open(output)
	lines=resultados_file.readlines()
	for line in lines:
		for data_name in data_index_names:
			number=re.findall(data_name + " \d+\.?\d*",line)
			if len(number)>0:
				for a in number:
					number_str = a[len(data_name)+1:]
					values+=[number_str]
				

	return values

def getImages(name,folder,outputFolder):
	global urb_area_t0_counter
	global urb_area_t1_counter
	global urb_footprint_t0_counter
	global urb_footprint_t1_counter

	imageNames=['urbArea_t0.img','urbArea_t1.img','urbFootprint_t0.img','urbFootprint_t1.img','New_Development_t0_t1.img']
	imageNamesPng=['urbArea_t0.png','urbArea_t1.png','urbFootprint_t0.png','urbFootprint_t1.png','newDevelopment.png']
	
	for image in imageNames:
		cmd = '''find ''' + folder + '''  -name ''' + image
		output=commands.getoutput(cmd)

		if(len(output)==0):
			urb_area_t0_counter=urb_area_t0_counter +1 

		filename_img=  output
		cmd = ''' cp ''' + output + ''' ''' + outputFolder 
		#print cmd
		#commands.getoutput(cmd)
		#convert images
		outputImagePng = outputFolder+ '/' + imageNamesPng[imageNames.index(image)]

		#print outputImagePng
		filename_img=  output
		cmd = ''' python pct2rgb.py -of PNG ''' +  output + ''' ''' + outputImagePng
		output= commands.getoutput(cmd)

		#get coordinates
		(e,w,n,s)=getCoordinates(filename_img)
		
 	return (n,s,e,w)	
		


	

def fixName(name):
	try:
		fixedName = elimina_tildes(name)
		fixedName = fixedName.replace(' ','_')
		fixedName = fixedName.replace('(','')
		fixedName = fixedName.replace(')','')

		#fixedName = elimina_tildes(fixedName)
	except Exception as err:
		print err
		#print "error with " + name		
	
	return fixedName


def elimina_tildes(cadena):
    # http://guimi.net
    
    # http://www.leccionespracticas.com/uncategorized/eliminar-tildes-con-python-solucionado/
    s = ''.join((c for c in unicodedata.normalize('NFD',unicode(cadena)) if unicodedata.category(c) != 'Mn'))
    return s.decode()

def checkPolygonMapDuplicates(polygonMap):
	for key in polygonMap.keys():
		for key2 in polygonMap.keys():
			if key != key2:
				if polygonMap[key]==polygonMap[key2]:
					print "key " + key + " equal to key: " + key2

def getCoordinates(imagePath):
	# get the existing coordinate system
	ds = gdal.Open(imagePath)
	old_cs= osr.SpatialReference()
	old_cs.ImportFromWkt(ds.GetProjectionRef())

	# create the new coordinate system
	wgs84_wkt = """
	GEOGCS["WGS 84",
	    DATUM["WGS_1984",
	        SPHEROID["WGS 84",6378137,298.257223563,
	            AUTHORITY["EPSG","7030"]],
	        AUTHORITY["EPSG","6326"]],
	    PRIMEM["Greenwich",0,
	        AUTHORITY["EPSG","8901"]],
	    UNIT["degree",0.01745329251994328,
	        AUTHORITY["EPSG","9122"]],
	    AUTHORITY["EPSG","4326"]]"""
	new_cs = osr.SpatialReference()
	new_cs .ImportFromWkt(wgs84_wkt)

	# create a transform object to convert between coordinate systems
	transform = osr.CoordinateTransformation(old_cs,new_cs) 

	#get the point to transform, pixel (0,0) in this case
	width = ds.RasterXSize
	height = ds.RasterYSize
	gt = ds.GetGeoTransform()
	minx = gt[0]
	miny = gt[3] + width*gt[4] + height*gt[5] 
	maxx = gt[0] + width*gt[1] + height*gt[2]
	maxy = gt[3]
	#get the coordinates in lat long
	(north,west,a) = transform.TransformPoint(minx,miny) 
	(south,east,a) = transform.TransformPoint(maxx,maxy)
	return (north,south,east,west)

def getOldTownships():
	townships = dict()
	municipiosViejos = open('municipiosViejos.csv')
	reader = csv.reader(municipiosViejos)
	for row in reader:
		townships[row[3]] = row[0]

	print townships	
	print len(townships)
	return townships




output_hits = 0
error_hits  = 0
total_hits =0
urb_area_t0_counter = 0
urb_area_t1_counter = 0
urb_footprint_t0_counter = 0
urb_footprint_t1_counter = 0
resultados_counter = 0

main()
