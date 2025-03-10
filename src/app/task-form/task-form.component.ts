import { Component } from '@angular/core';
import { ReactiveFormsModule ,FormGroup, FormControl } from '@angular/forms';
import { StorageService } from '../storage.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule],
})
export class TaskFormComponent{
   //a form group for task fields
  taskForm=new FormGroup({
    name: new FormControl(''), 
    description: new FormControl(''), 
    dueDate: new FormControl(''), 
    priority: new FormControl('low'),//default
    location: new FormControl('home') //default
  });
 //inject the storage service for asve and update tasks
  constructor(private storageService: StorageService){}

  onSubmit(){
    //wehn submit
    const task=this.taskForm.value;
    // save the task and trigger the upodate
    this.storageService.saveTask(task);  
    //reset the forms
    this.taskForm.reset();  
  }
}
