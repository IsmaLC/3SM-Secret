use rand::prelude::*;
use crate::models::{PasswordGenOptions, PasswordGenResult};

pub fn generate_password_with_options(opts: &PasswordGenOptions) -> PasswordGenResult {
    let mut charset: Vec<char> = Vec::new();
    
    let uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // omitimos I, O para evitar confusión visual si se desea, o conjunto estándar
    let lowercase = "abcdefghijkmnopqrstuvwxyz";
    let numbers = "23456789";
    let symbols = "!@#$%^&*()-_=+[]{};:,.<>?";

    if opts.use_uppercase {
        charset.extend(uppercase.chars());
    }
    if opts.use_lowercase {
        charset.extend(lowercase.chars());
    }
    if opts.use_numbers {
        charset.extend(numbers.chars());
    }
    if opts.use_symbols {
        charset.extend(symbols.chars());
    }

    if charset.is_empty() {
        charset.extend("abcdefghijklmnopqrstuvwxyz".chars());
    }

    let mut rng = rand::thread_rng();
    let length = opts.length.clamp(6, 128);
    
    let mut password_chars: Vec<char> = Vec::with_capacity(length);
    
    // Garantizar al menos un carácter de cada tipo seleccionado si es posible
    if opts.use_uppercase {
        if let Some(c) = uppercase.chars().choose(&mut rng) { password_chars.push(c); }
    }
    if opts.use_lowercase {
        if let Some(c) = lowercase.chars().choose(&mut rng) { password_chars.push(c); }
    }
    if opts.use_numbers {
        if let Some(c) = numbers.chars().choose(&mut rng) { password_chars.push(c); }
    }
    if opts.use_symbols {
        if let Some(c) = symbols.chars().choose(&mut rng) { password_chars.push(c); }
    }

    while password_chars.len() < length {
        if let Some(c) = charset.choose(&mut rng) {
            password_chars.push(*c);
        }
    }

    // Mezclar para no tener el primer carácter siempre mayúscula, etc.
    password_chars.shuffle(&mut rng);
    let password: String = password_chars.into_iter().collect();

    // Calcular entropía: bits = length * log2(charset_size)
    let charset_size = charset.len() as f64;
    let entropy_bits = (length as f64) * charset_size.log2();

    let strength_score = if entropy_bits < 40.0 {
        1 // Débil
    } else if entropy_bits < 60.0 {
        2 // Regular
    } else if entropy_bits < 80.0 {
        3 // Buena
    } else {
        4 // Fuerte / Excelente
    };

    PasswordGenResult {
        password,
        entropy_bits: (entropy_bits * 10.0).round() / 10.0,
        strength_score,
    }
}
