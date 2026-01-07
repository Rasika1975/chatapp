package com.chatapp.demo.controller;

import com.chatapp.demo.dto.LoginDto;
import com.chatapp.demo.models.History;

import com.chatapp.demo.models.User;
import com.chatapp.demo.repositories.HistoryRepo;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private com.chatapp.demo.repositories.UserRepo userRepo;

    @Autowired
    private HistoryRepo historyRepo;

    // Register
    @PostMapping("/register")
    public String register(@RequestBody User user) {
        if (userRepo.findByUsername(user.getUsername()).isPresent()) {
            return "Username already exists";
        }
        user.setRole("USER");
        user.setStatus("OFFLINE");
        userRepo.save(user);
        return "Registration Successful";
    }

    // Login (VBS style)
    @PostMapping("/login")
    public String login(@RequestBody LoginDto dto) {
        Optional<User> user = userRepo.findByUsernameAndPassword(dto.getUsername(), dto.getPassword());

        if (user.isPresent()) {
            User u = user.get();
            u.setStatus("ONLINE");
            userRepo.save(u);

            // History save (VBS jaisa)
            History h = new History();
            h.setUserId(u.getId());
            h.setAction("LOGIN");
            h.setDetails("User logged in");
            h.setTimestamp(LocalDateTime.now());
            historyRepo.save(h);

            return "Login Success - User ID: " + u.getId();
        }
        return "Invalid Credentials";
    }

    // Logout
    @PostMapping("/logout/{id}")
    public String logout(@PathVariable int id) {
        Optional<User> user = userRepo.findById(id);
        if (user.isPresent()) {
            User u = user.get();
            u.setStatus("OFFLINE");
            userRepo.save(u);

            History h = new History();
            h.setUserId(id);
            h.setAction("LOGOUT");
            h.setDetails("User logged out");
            h.setTimestamp(LocalDateTime.now());
            historyRepo.save(h);

            return "Logout Successful";
        }
        return "User Not Found";
    }
}