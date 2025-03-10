import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService{
  //key used to store tasks in localStorage
  private storageKey= 'taskList';
   //BehaviorSubject to store and watch task changes, initialize with tasks from localStorage
  private tasksSubject=new BehaviorSubject<any[]>(this.getTasks());

  constructor() {}
  //returns observable of tasks, allowing components to get notice of task changes
  getTasksObservable(){
    return this.tasksSubject.asObservable();
  }
  // Retrieves the tasks from localStorage, returns an empty array if no tasks are found
  getTasks(): any[]{
    const tasks = localStorage.getItem(this.storageKey);
    return tasks ? JSON.parse(tasks) : [];
  }

  //saves a new task by adding it to the existing task list and store in localStorage
  saveTask(task: any): void{
    const tasks = this.getTasks();// get current task
    tasks.push(task);// add new task to the list
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));// save task to localStorage
    this.tasksSubject.next(tasks);// update th list by BehaviorSubject
  }

  //saves the entire task list, use when update the order after drag and drop
  saveTasks(tasks: any[]): void{
    localStorage.setItem(this.storageKey, JSON.stringify(tasks)); 
    this.tasksSubject.next(tasks);
  }

  
  //edits a task by update it based on index and save the updated list to localStorage
  editTask(index: number, updatedTask: any): void{
    const tasks=this.getTasks();
    tasks[index]=updatedTask;// use new one replace the old one 
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  //deletes a task by removing it from the task list based on its index and updating localStorage
  deleteTask(index: number): void{
    const tasks=this.getTasks();
    tasks.splice(index, 1); // remove task by index
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }
}
