import { Component } from '@angular/core';
import { StorageService } from '../storage.service';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

//task interface, location has to be school, home, or supermarket
interface Task{
  name: string;
  description: string;
  dueDate: string;
  priority: string;
  location: 'school' | 'home' | 'supermarket';
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
})
export class TaskListComponent{
  //task list
  tasks: Task[]=[];  
  //currently editing task index
  editingIndex: number | null=null;
  //user's current location
  currentLocation: { latitude: number; longitude: number} | null=null;
   //recommended tasks list
  recommendedTasks: Task[]=[]; 

  // defin locations 
  locations ={
    //bu 
    school: { latitude: 42.349449, longitude: -71.101303 },
    //my room in melrose
    home: { latitude: 42.444890, longitude: -71.056380 },
    //aldi in between school and home
    supermarket: { latitude: 42.406971, longitude: -71.083977 },
  };

  //Define form
  editForm: FormGroup= new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    dueDate: new FormControl(''),
    priority: new FormControl('low'),
    location: new FormControl('home')  //default is home
  });

  constructor(private storageService: StorageService){
    //watch task changes, auto-update task list on changes
    this.storageService.getTasksObservable().subscribe(tasks =>{
      this.tasks = tasks;
      //update the recommened task
      this.recommendTasks();  
    });
    this.getCurrentLocation();  //get the current location
  }

  //if success, call recommendTasks to update recommended task
  getCurrentLocation(){
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition((position) =>{
        this.currentLocation ={
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.recommendTasks();// update
      }, 
      (error) =>{
        console.error('Error getting location:', error.message);
        alert('Error getting location: ' + error.message);
      });
    } 
    else{
      alert('Geolocation is not supported by this browser.');
    }
  }

  // recommend base on location
  //sorting by priority and due date
  //if all condition is the same, 
  //recommend one is the one I drag the task list on the top
  recommendTasks(){
    if(this.currentLocation){
      const { latitude, longitude }= this.currentLocation;

      let nearestTasks: Task[]=[];
      let shortestDistance=Number.MAX_VALUE;
      //loop through all tasks and calculate distance from user for each task
      this.tasks.forEach((task) =>{
        const taskLocation= this.locations[task.location];
        if(!taskLocation) return;
        //calculate distance between user location and task location
        const distance= this.calculateDistance(latitude, longitude, taskLocation.latitude, taskLocation.longitude);
         // 
        //ifcurrent task is closer than shortest distance, update nearest task
        if (distance<shortestDistance){
          shortestDistance=distance;
          nearestTasks=[task];
        } 
        //if current task has the same distance, add it to the nearest tasks list
        else if (distance === shortestDistance){
          nearestTasks.push(task);
        }
      });

      //sort by due date and priority 

      //shortestdiastance was 30 mile
      //personal use application, so the if the distance is too small,
      //for example: bu is 8 miles from where I live 
      //if I use 3, and all task are located at bu, there wont be any recommend tasks.
      if(nearestTasks.length > 0 && shortestDistance < 30){
        nearestTasks.sort((a, b) =>{
          //sort by due date
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          //if due dates are diff, sort by first date
          if(dateA.getTime() !== dateB.getTime()){
            return dateA.getTime() - dateB.getTime();
          }
          //sort by prority if date are same
          const priorityMap={ low: 0, medium: 1, high: 2 };
          return priorityMap[b.priority as 'low' | 'medium' | 'high'] - priorityMap[a.priority as 'low' | 'medium' | 'high'];
        });
        //recommend the nearest task, but only one
        this.recommendedTasks = [nearestTasks[0]]; 
      } 
      else{
        //if no recommend tasks, clear 
        this.recommendedTasks=[];
      }
    }
  }

  // calculate the distance by Haversine 
  //all math 
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number{
    const R=6371;//radius od the earth 
    //latitude diff to radius
    const dLat=this.deg2rad(lat2 - lat1);
    //longitude diff to radius
    const dLon=this.deg2rad(lon2 - lon1);
    //Haversine formula
    const a=Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      //angular distance of the spher
    const c=2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //multiple by  radius of earch to get distance
    return R * c;
  }
// convert degrees to radians
  deg2rad(deg: number): number{
    return deg * (Math.PI / 180);
  }

  //editing task, put task information into form
  startEdit(index: number): void{
    //store the index of the task being edited
    this.editingIndex=index;
    const task=this.tasks[index];
    //set the form values using the task's information
    this.editForm.setValue({
      name: task.name,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      location: task.location
    });
  }

 
  //save edited task and update task list
  saveEdit(): void{
    if (this.editingIndex !== null){
      this.storageService.editTask(this.editingIndex, this.editForm.value);
      this.editingIndex= null;
    }
  }

  // cancel edit
  cancelEdit(): void{
    this.editingIndex=null;
  }

  // delete the task
  deleteTask(index: number): void{
    this.storageService.deleteTask(index);
  }

  //drag and drop
  drop(event: CdkDragDrop<string[]>): void{
    //moveiteminarray is for move one element from one location to another
    moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
    // save the whole list
    this.storageService.saveTasks(this.tasks);  
    //important,make sure the new order of tasks is saved in local storage
  }
}
