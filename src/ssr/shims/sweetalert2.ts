/** SSR stub for sweetalert2 */
const Swal = {
  fire: async () => ({ isConfirmed: false, isDenied: false, isDismissed: true }),
  close: () => undefined,
  mixin: () => Swal,
}

export default Swal
